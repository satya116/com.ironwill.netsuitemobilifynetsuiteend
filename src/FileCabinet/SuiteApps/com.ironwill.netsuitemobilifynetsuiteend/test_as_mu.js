
/**
 * @NApiVersion 2.1
 * @NScriptType MassUpdateScript
 */
define(["N/record", "N/search", "N/runtime", "N/format", "N/log"],
    (record, search, runtime, format, log) => {

    const REVIEW_FIELD = "custbody_test_as_overdue_review";
    const MIN_DAYS_PARAM = "custscript_test_as_min_overdue_days";

    function normalizeStatus(value) {
        if (Array.isArray(value)) {
            return value[0]?.text || value[0]?.value || "";
        }

        if (value && typeof value === "object") {
            return value.text || value.value || "";
        }

        return String(value || "");
    }

    function toDate(value) {
        if (!value) {
            return null;
        }

        if (value instanceof Date) {
            return value;
        }

        return format.parse({
            value,
            type: format.Type.DATE
        });
    }

    function calendarDay(date) {
        return Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        ) / 86400000;
    }

    function each(params) {
        const script = runtime.getCurrentScript();
        const orderId = Number(params.id);

        try {
            if (!Number.isInteger(orderId) || orderId <= 0) {
                throw new Error(`Invalid Sales Order ID: ${params.id}`);
            }

            const minimumDays = Number(
                script.getParameter({
                    name: MIN_DAYS_PARAM
                })
            );

            if (!Number.isInteger(minimumDays) || minimumDays < 1) {
                throw new Error(
                    "Minimum overdue days must be a positive integer."
                );
            }

            const values = search.lookupFields({
                type: search.Type.SALES_ORDER,
                id: orderId,
                columns: ["status", "duedate"]
            });

            const status = normalizeStatus(values.status);

            const eligibleStatuses = [
                "Pending Fulfillment",
                "Pending Billing/Partially Fulfilled",
                "B",
                "E"
            ];

            if (!eligibleStatuses.includes(status)) {
                log.debug({
                    title: `Skipped Sales Order ${orderId}`,
                    details: `Ineligible status: ${status}`
                });
                return;
            }

            const dueDate = toDate(values.duedate);

            if (!dueDate || Number.isNaN(dueDate.getTime())) {
                log.debug({
                    title: `Skipped Sales Order ${orderId}`,
                    details: "No valid due date"
                });
                return;
            }

            const today = new Date();

            const overdueDays = Math.floor(
                calendarDay(today) - calendarDay(dueDate)
            );

            const shouldReview = overdueDays >= minimumDays;

            record.submitFields({
                type: record.Type.SALES_ORDER,
                id: orderId,
                values: {
                    [REVIEW_FIELD]: shouldReview
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields: false
                }
            });

            log.audit({
                title: `Processed Sales Order ${orderId}`,
                details: {
                    status,
                    overdueDays,
                    minimumDays,
                    shouldReview,
                    remainingUsage: script.getRemainingUsage()
                }
            });

        } catch (error) {
            log.error({
                title: `Mass Update failed for Sales Order ${params.id}`,
                details: error
            });

            throw error;
        }
    }

    return { each };
});
