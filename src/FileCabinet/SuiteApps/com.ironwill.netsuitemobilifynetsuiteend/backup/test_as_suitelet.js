/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget"], (serverWidget) => {

  function onRequest(context) {

    if (context.request.method === "GET") {

      const form = serverWidget.createForm({
        title: "Sales Order Search",
      });

      form.addFieldGroup({
        id: "test_as_filters",
        label: "Filters",
      });

      // Customer
      form.addField({
        id: "test_as_customer",
        type: serverWidget.FieldType.SELECT,
        label: "Customer",
        source: "customer",
        container: "test_as_filters",
      });

      // Status
      const statusField = form.addField({
        id: "test_as_status",
        type: serverWidget.FieldType.SELECT,
        label: "Status",
        container: "test_as_filters",
      });

      statusField.addSelectOption({
        value: "",
        text: "All",
      });

      statusField.addSelectOption({
        value: "SalesOrd:A",
        text: "Pending Approval",
      });

      statusField.addSelectOption({
        value: "SalesOrd:B",
        text: "Pending Fulfillment",
      });

      statusField.addSelectOption({
        value: "SalesOrd:D",
        text: "Partially Fulfilled",
      });

      statusField.addSelectOption({
        value: "SalesOrd:E",
        text: "Pending Billing / Partially Fulfilled",
      });

      statusField.addSelectOption({
        value: "SalesOrd:F",
        text: "Pending Billing",
      });

      statusField.addSelectOption({
        value: "SalesOrd:G",
        text: "Billed",
      });

      statusField.addSelectOption({
        value: "SalesOrd:H",
        text: "Closed",
      });

      statusField.addSelectOption({
        value: "SalesOrd:C",
        text: "Cancelled",
      });


      form.addSubmitButton({
        label: "Search",
      });


      const sublist = form.addSublist({
        id: "test_as_results",
        type: serverWidget.SublistType.LIST,
        label: "Search Results",
      });

      sublist.addField({
        id: "test_as_so_number",
        type: serverWidget.FieldType.TEXT,
        label: "SO Number",
      });

      sublist.addField({
        id: "test_as_result_customer",
        type: serverWidget.FieldType.TEXT,
        label: "Customer",
      });

      sublist.addField({
        id: "test_as_date",
        type: serverWidget.FieldType.DATE,
        label: "Date",
      });

      sublist.addField({
        id: "test_as_amount",
        type: serverWidget.FieldType.CURRENCY,
        label: "Amount",
      });

      context.response.writePage(form);
    }
  }

  return {
    onRequest,
  };
});