/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define([
  "N/https",
  "N/record",
  "N/email",
  "N/search",
  "N/ui/serverWidget",
], function callbackFunction(https, record, email, search, serverWidget) {
  const PAGE_SIZE = 100;

  const SALES_ORDER_STATUS = [
    { value: "SalesOrd:A", text: "Pending Approval" },
    { value: "SalesOrd:B", text: "Pending Fulfillment" },
    { value: "SalesOrd:C", text: "Cancelled" },
    { value: "SalesOrd:D", text: "Partially Fulfilled" },
    { value: "SalesOrd:E", text: "Pending Billing/Partially Fulfilled" },
    { value: "SalesOrd:F", text: "Billed" },
    { value: "SalesOrd:G", text: "Closed" },
  ];

  function getFunction(context, transactionSearch) {
    const form = serverWidget.createForm({
      title: "Sales Order Search",
      hideNavBar: false,
    });

    form.addField({
      id: "cust_test_as_date_from",
      type: serverWidget.FieldType.DATE,
      label: "Date From",
    });

    form.addField({
      id: "cust_test_as_date_to",
      type: serverWidget.FieldType.DATE,
      label: "Date To",
    });

    form.addField({
      id: "cust_test_as_customer",
      type: serverWidget.FieldType.SELECT,
      label: "Customer",
      source: "customer",
    });

    // search
    //   .create({
    //     type: "customer",
    //     filters: [],
    //     columns: ["entityid"],
    //   })
    //   .run()
    //   .each((result) => {
    //     customerField.addSelectOption({
    //       value: result.id,
    //       text: result.getValue({ name: "entityid" }),
    //     });

    //     return true;
    //   });

    const soStatusField = form.addField({
      id: "cust_test_as_order_status",
      type: serverWidget.FieldType.SELECT,
      label: "Order Status",
    });

    soStatusField.addSelectOption({
      value: "",
      text: "Select",
      isSelected: true,
    });

    SALES_ORDER_STATUS.forEach((status) => {
      soStatusField.addSelectOption(status);
    });

    form.addSubmitButton({
      label: "Search",
    });

    const transactionSearchPagedData = transactionSearch.runPaged({
      pageSize: PAGE_SIZE,
    });

    let transactionSearchPage;
    if (transactionSearchPagedData.count > 0) {
      transactionSearchPage = transactionSearchPagedData.fetch({
        index: 0,
      });
    }

    const salesOrderResultSublist = form.addSublist({
      id: "custpage_test_as_results",
      type: serverWidget.SublistType.LIST,
      label: "Sales Orders",
    });

    [
      ["internalid", "Internal ID"],
      ["tranid", "Transaction Number"],
      ["entity", "Customer"],
      ["trandate", "Date"],
      ["status", "Status"],
      ["total", "Total Amount"],
    ].forEach(([id, label]) => {
      salesOrderResultSublist.addField({
        id: "custpage_" + id,
        type: serverWidget.FieldType.TEXT,
        label,
      });
    });

    transactionSearchPage.data.forEach((result, index) => {
      salesOrderResultSublist.setSublistValue({
        id: "custpage_internalid",
        line: index,
        value: result.getValue({ name: "internalid" }),
      });
    });

    context.response.writePage(form);
  }

  function postFunction(context) {
    // context.request.parameters.
  }

  const createSearch = (userFilters) => {
    let searchFilters = [];

    searchFilters.push(["type", "anyof", "Salesord"], "AND", [
      "mainline",
      "is",
      "T",
    ]);

    if (userFilters.fromDate) {
      searchFilters.push("AND", [
        "trandate",
        "onorafter",
        userFilters.fromDate,
      ]);
    }

    if (userFilters.toDate) {
      searchFilters.push("AND", ["trandate", "onorbefore", userFilters.toDate]);
    }

    if (userFilters.customer) {
      searchFilters.push("AND", ["entity", "anyof", userFilters.customer]);
    }

    if (userFilters.status) {
      searchFilters.push("AND", ["status", "anyof", userFilters.status]);
    }

    return search.create({
      type: search.Type.TRANSACTION,
      filters: searchFilters,
      columns: [
        search.createColumn({ name: "internalid" }),
        search.createColumn({ name: "tranid" }),
        search.createColumn({ name: "entity" }),
        search.createColumn({ name: "trandate" }),
        search.createColumn({ name: "statusref" }),
        search.createColumn({ name: "total" }),
      ],
    });
  };

  function onRequestFn(context) {
    // shuru mein hi search kar leta hun kuch sales order

    const userFilters = {
      fromDate: context.request.parameters.cust_test_as_date_from || "",
      toDate: context.request.parameters.cust_test_as_date_to || "",
      customer: context.request.parameters.cust_test_as_customer || "",
      status: context.request.parameters.cust_test_as_order_status || "",
    };

    const transactionSearch = createSearch(userFilters);

    if (context.request.method === "GET") {
      getFunction(context, transactionSearch);
    } else {
      postFunction(context);
    }
  }

  return {
    onRequest: onRequestFn,
  };
});

// Question: Build a Transaction Search Suitelet with Pagination and CSV Export

// You are asked to develop a Suitelet for the Finance team to search and export Sales Orders.

// 2\. When the user submits the form, display matching Sales Orders in a sublist containing:

// - Internal ID
// - Transaction Number
// - Customer
// - Date
// - Status
// - Total Amount

// 3\. Implement pagination with 100 records per page. Users must be able to navigate between pages without losing their filters.

// 4\. Add an Export CSV button that exports all matching records, not just the current page.

// 5\. Handle these edge cases:

// - Invalid date range (`Date From > Date To`)
// - No matching records
// - More than 10,000 matching records
// - Special characters in customer names when exporting CSV
// - Governance limits and large result sets

// ### Constraints

// - SuiteScript 2.1
// - Suitelet only; no client script required
// - Use `N/ui/serverWidget`, `N/search`, and `N/file` where appropriate.
// - Do not load each Sales Order individually.
// - Do not use a single search that attempts to retrieve every result using `getRange()` beyond its supported limits.

// ### Your task

// Write the complete Suitelet script, including `onRequest`, form creation, search filters, pagination, and CSV export.

// Senior-level follow-up: How would you modify the design if the search returned 200,000 Sales Orders and the CSV export had to run reliably without timing out?

// Reply with your code. I’ll review it as an interviewer, identify bugs and governance issues, and ask follow-up questions one at a time.
