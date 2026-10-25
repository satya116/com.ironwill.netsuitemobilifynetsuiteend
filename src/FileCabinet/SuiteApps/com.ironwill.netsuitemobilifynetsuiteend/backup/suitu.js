
/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define([
    "N/ui/serverWidget",
    "N/search",
    "N/file",
    "N/url",
    "N/runtime",
    "N/format"
], (
    serverWidget,
    search,
    file,
    url,
    runtime,
    format
) => {
    const PAGE_SIZE = 100;
    const EXPORT_PAGE_SIZE = 1000;

    const STATUS_OPTIONS = [
        { value: "A", text: "Pending Approval" },
        { value: "B", text: "Pending Fulfillment" },
        { value: "C", text: "Cancelled" },
        { value: "D", text: "Partially Fulfilled" },
        { value: "E", text: "Pending Billing/Partially Fulfilled" },
        { value: "F", text: "Billed" },
        { value: "G", text: "Closed" }
    ];

    function parseDate(value) {
        if (!value) {
            return null;
        }

        const parsedDate = format.parse({
            value: value,
            type: format.Type.DATE
        });

        if (!(parsedDate instanceof Date) || isNaN(parsedDate.getTime())) {
            throw new Error("Invalid date provided.");
        }

        return parsedDate;
    }

    function validateDateRange(fromDate, toDate) {
        if (!fromDate || !toDate) {
            return;
        }

        const from = parseDate(fromDate);
        const to = parseDate(toDate);

        const fromKey = [
            from.getFullYear(),
            from.getMonth(),
            from.getDate()
        ].join("-");

        const toKey = [
            to.getFullYear(),
            to.getMonth(),
            to.getDate()
        ].join("-");

        const normalizedFrom = new Date(
            from.getFullYear(),
            from.getMonth(),
            from.getDate()
        );

        const normalizedTo = new Date(
            to.getFullYear(),
            to.getMonth(),
            to.getDate()
        );

        if (normalizedFrom.getTime() > normalizedTo.getTime()) {
            throw new Error("Date From cannot be later than Date To.");
        }
    }

    function escapeHtml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function csvCell(value) {
        let text = String(value ?? "");

        if (/^[\s]*[=+\-@]/.test(text)) {
            text = "'" + text;
        }

        return '"' + text.replace(/"/g, '""') + '"';
    }

    function getFilters(params) {
        const filters = {
            fromDate: params.custpage_from_date || "",
            toDate: params.custpage_to_date || "",
            customer: params.custpage_customer || "",
            status: params.custpage_status || ""
        };

        validateDateRange(filters.fromDate, filters.toDate);

        return filters;
    }

    function createSearch(filters) {
        const searchFilters = [
            ["type", "anyof", "SalesOrd"],
            "AND",
            ["mainline", "is", "T"]
        ];

        if (filters.fromDate) {
            searchFilters.push(
                "AND",
                ["trandate", "onorafter", filters.fromDate]
            );
        }

        if (filters.toDate) {
            searchFilters.push(
                "AND",
                ["trandate", "onorbefore", filters.toDate]
            );
        }

        if (filters.customer) {
            searchFilters.push(
                "AND",
                ["entity", "anyof", filters.customer]
            );
        }

        if (filters.status) {
            searchFilters.push(
                "AND",
                ["status", "anyof", filters.status]
            );
        }

        return search.create({
            type: search.Type.TRANSACTION,
            filters: searchFilters,
            columns: [
                search.createColumn({
                    name: "internalid",
                    sort: search.Sort.ASC
                }),
                search.createColumn({ name: "tranid" }),
                search.createColumn({ name: "entity" }),
                search.createColumn({ name: "trandate" }),
                search.createColumn({ name: "statusref" }),
                search.createColumn({ name: "total" })
            ]
        });
    }

    function createForm(filters) {
        const form = serverWidget.createForm({
            title: "Sales Order Search"
        });

        const fromField = form.addField({
            id: "custpage_from_date",
            type: serverWidget.FieldType.DATE,
            label: "Date From"
        });

        const toField = form.addField({
            id: "custpage_to_date",
            type: serverWidget.FieldType.DATE,
            label: "Date To"
        });

        const customerField = form.addField({
            id: "custpage_customer",
            type: serverWidget.FieldType.SELECT,
            label: "Customer",
            source: "customer"
        });

        const statusField = form.addField({
            id: "custpage_status",
            type: serverWidget.FieldType.SELECT,
            label: "Order Status"
        });

        statusField.addSelectOption({
            value: "",
            text: "- Any -"
        });

        STATUS_OPTIONS.forEach(option => {
            statusField.addSelectOption(option);
        });

        if (filters.fromDate) {
            fromField.defaultValue = filters.fromDate;
        }

        if (filters.toDate) {
            toField.defaultValue = filters.toDate;
        }

        if (filters.customer) {
            customerField.defaultValue = filters.customer;
        }

        if (filters.status) {
            statusField.defaultValue = filters.status;
        }

        form.addSubmitButton({
            label: "Search"
        });

        return form;
    }

    function addResults(form, pagedData, pageIndex) {
        const sublist = form.addSublist({
            id: "custpage_results",
            type: serverWidget.SublistType.LIST,
            label: "Sales Orders"
        });

        const fields = [
            ["internalid", "Internal ID"],
            ["tranid", "Transaction Number"],
            ["entity", "Customer"],
            ["trandate", "Date"],
            ["status", "Status"],
            ["total", "Total Amount"]
        ];

        fields.forEach(([id, label]) => {
            sublist.addField({
                id: "custpage_" + id,
                type: serverWidget.FieldType.TEXT,
                label: label
            });
        });

        if (pagedData.count === 0) {
            const message = form.addField({
                id: "custpage_message",
                type: serverWidget.FieldType.INLINEHTML,
                label: " "
            });

            message.defaultValue = "<p>No matching Sales Orders found.</p>";
            return;
        }

        const page = pagedData.fetch({
            index: pageIndex
        });

        page.data.forEach((result, index) => {
            const values = {
                internalid: result.getValue({ name: "internalid" }),
                tranid: result.getValue({ name: "tranid" }),
                entity: result.getText({ name: "entity" }) ||
                    result.getValue({ name: "entity" }),
                trandate: result.getValue({ name: "trandate" }),
                status: result.getText({ name: "statusref" }) ||
                    result.getValue({ name: "statusref" }),
                total: result.getValue({ name: "total" })
            };

            Object.entries(values).forEach(([key, value]) => {
                if (value !== null && value !== undefined && value !== "") {
                    sublist.setSublistValue({
                        id: "custpage_" + key,
                        line: index,
                        value: String(value)
                    });
                }
            });
        });
    }

    function buildActionUrl(filters, pageIndex, exportCsv) {
        return url.resolveScript({
            scriptId: runtime.getCurrentScript().id,
            deploymentId: runtime.getCurrentScript().deploymentId,
            params: {
                custpage_from_date: filters.fromDate,
                custpage_to_date: filters.toDate,
                custpage_customer: filters.customer,
                custpage_status: filters.status,
                custpage_page: String(pageIndex),
                custpage_export: exportCsv ? "T" : "F"
            }
        });
    }

    function addNavigation(form, filters, pagedData, pageIndex) {
        const totalPages = pagedData.pageRanges.length;

        const previousUrl = pageIndex > 0
            ? buildActionUrl(filters, pageIndex - 1, false)
            : null;

        const nextUrl = pageIndex < totalPages - 1
            ? buildActionUrl(filters, pageIndex + 1, false)
            : null;

        const exportUrl = buildActionUrl(filters, 0, true);

        const navigation = form.addField({
            id: "custpage_navigation",
            type: serverWidget.FieldType.INLINEHTML,
            label: " "
        });

        navigation.defaultValue = `
            <div style="margin:12px 0">
                <p>
                    Total matching records: ${pagedData.count}
                    | Page ${pageIndex + 1} of ${totalPages}
                </p>
                ${previousUrl
                    ? `<a href="${escapeHtml(previousUrl)}">Previous</a>`
                    : "Previous"}
                &nbsp; | &nbsp;
                ${nextUrl
                    ? `<a href="${escapeHtml(nextUrl)}">Next</a>`
                    : "Next"}
                &nbsp; | &nbsp;
                <a href="${escapeHtml(exportUrl)}">Export CSV</a>
            </div>
        `;
    }

    function exportCsv(transactionSearch) {
        const pagedData = transactionSearch.runPaged({
            pageSize: EXPORT_PAGE_SIZE
        });

        const rows = [[
            "Internal ID",
            "Transaction Number",
            "Customer",
            "Date",
            "Status",
            "Total Amount"
        ]];

        pagedData.pageRanges.forEach(pageRange => {
            const page = pagedData.fetch({
                index: pageRange.index
            });

            page.data.forEach(result => {
                rows.push([
                    result.getValue({ name: "internalid" }),
                    result.getValue({ name: "tranid" }),
                    result.getText({ name: "entity" }) ||
                        result.getValue({ name: "entity" }),
                    result.getValue({ name: "trandate" }),
                    result.getText({ name: "statusref" }) ||
                        result.getValue({ name: "statusref" }),
                    result.getValue({ name: "total" })
                ]);
            });
        });

        const csvContent = "\uFEFF" + rows
            .map(row => row.map(csvCell).join(","))
            .join("\r\n");

        return file.create({
            name: "sales_orders.csv",
            fileType: file.Type.CSV,
            contents: csvContent
        });
    }

    function onRequest(context) {
        try {
            const params = context.request.parameters;
            const filters = getFilters(params);
            const transactionSearch = createSearch(filters);

            if (params.custpage_export === "T") {
                const csvFile = exportCsv(transactionSearch);

                context.response.writeFile({
                    file: csvFile,
                    isInline: false
                });

                return;
            }

            const form = createForm(filters);

            const pagedData = transactionSearch.runPaged({
                pageSize: PAGE_SIZE
            });

            const requestedPage = parseInt(
                params.custpage_page || "0",
                10
            );

            const pageIndex = Number.isFinite(requestedPage)
                ? Math.max(
                    0,
                    Math.min(
                        requestedPage,
                        Math.max(0, pagedData.pageRanges.length - 1)
                    )
                )
                : 0;

            addResults(form, pagedData, pageIndex);

            if (pagedData.count > 0) {
                addNavigation(form, filters, pagedData, pageIndex);
            }

            context.response.writePage(form);

        } catch (error) {
            const form = serverWidget.createForm({
                title: "Sales Order Search"
            });

            const message = form.addField({
                id: "custpage_error",
                type: serverWidget.FieldType.INLINEHTML,
                label: " "
            });

            message.defaultValue =
                "<p style='color:red'>" +
                escapeHtml(error.message || "An unexpected error occurred.") +
                "</p>";

            context.response.writePage(form);
        }
    }

    return {
        onRequest: onRequest
    };
});
