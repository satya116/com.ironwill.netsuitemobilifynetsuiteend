/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

define(["N/ui/serverWidget", "N/search", "N/redirect"], (
  serverWidget,
  search,
  redirect,
) => {
  const onRequest = (context) => {
    const request = context.request;
    const response = context.response;

    if (request.method === "GET") {
      showForm(context);
    } else {
      processForm(context);
    }
  };

  const showForm = (context) => {
    const form = serverWidget.createForm({
      title: "Customer Management",
    });

    form.clientScriptModulePath = "./test_as_client.js";

    form.addFieldGroup({
      id: "custpage_test_as_basic_group",
      label: "Basic Information",
    });

    const nameField = form.addField({
      id: "custpage_test_as_name",
      type: serverWidget.FieldType.TEXT,
      label: "Customer Name",
      container: "custpage_test_as_basic_group",
    });

    nameField.isMandatory = true;

    nameField.updateDisplaySize({
      height: 1,
      width: 40,
    });

    const emailField = form.addField({
      id: "custpage_test_as_email",
      type: serverWidget.FieldType.EMAIL,
      label: "Email",
      container: "custpage_test_as_basic_group",
    });

    const statusField = form.addField({
      id: "custpage_test_as_status",
      type: serverWidget.FieldType.SELECT,
      label: "Status",
      container: "custpage_test_as_basic_group",
    });

    statusField.addSelectOption({
      value: "",
      text: "",
    });

    statusField.addSelectOption({
      value: "active",
      text: "Active",
    });

    statusField.addSelectOption({
      value: "inactive",
      text: "Inactive",
    });

    const dateField = form.addField({
      id: "custpage_test_as_date",
      type: serverWidget.FieldType.DATE,
      label: "Date",
      container: "custpage_test_as_basic_group",
    });

    dateField.defaultValue = new Date();

    const descriptionField = form.addField({
      id: "custpage_test_as_description",
      type: serverWidget.FieldType.LONGTEXT,
      label: "Description",
    });

    descriptionField.updateLayoutType({
      layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE,
    });

    const hiddenField = form.addField({
      id: "custpage_test_as_internal_data",
      type: serverWidget.FieldType.TEXT,
      label: "Internal Data",
    });

    hiddenField.updateDisplayType({
      displayType: serverWidget.FieldDisplayType.HIDDEN,
    });

    hiddenField.defaultValue = "ABC123";

    form.addTab({
      id: "custpage_test_as_customer_tab",
      label: "Customers",
    });

    form.addSubtab({
      id: "custpage_test_as_customer_subtab",
      label: "Customer List",
      tab: "custpage_test_as_customer_tab",
    });

    const sublist = form.addSublist({
      id: "custpage_test_as_customer_list",
      type: serverWidget.SublistType.LIST,
      label: "Customers",
      tab: "custpage_test_as_customer_subtab",
    });

    sublist.addMarkAllButtons();

    sublist.addField({
      id: "custpage_test_as_select",
      type: serverWidget.FieldType.CHECKBOX,
      label: "Select",
    });

    sublist.addField({
      id: "custpage_test_as_id",
      type: serverWidget.FieldType.TEXT,
      label: "Internal ID",
    });

    sublist.addField({
      id: "custpage_test_as_customer_name",
      type: serverWidget.FieldType.TEXT,
      label: "Customer",
    });

    sublist.addField({
      id: "custpage_test_as_customer_email",
      type: serverWidget.FieldType.EMAIL,
      label: "Email",
    });

    const customerSearch = search.create({
      type: search.Type.CUSTOMER,

      filters: [["isinactive", "is", "F"]],

      columns: ["internalid", "entityid", "email"],
    });

    const results = customerSearch.run().getRange({
      start: 0,
      end: 100,
    });

    results.forEach((result, index) => {
      sublist.setSublistValue({
        id: "custpage_test_as_id",
        line: index,
        value: result.id,
      });

      const customerName = result.getValue({
        name: "entityid",
      });

      if (customerName) {
        sublist.setSublistValue({
          id: "custpage_test_as_customer_name",
          line: index,
          value: customerName,
        });
      }

      const email = result.getValue({
        name: "email",
      });

      if (email) {
        sublist.setSublistValue({
          id: "custpage_test_as_customer_email",
          line: index,
          value: email,
        });
      }
    });

    form.addButton({
      id: "custpage_test_as_custom_button",
      label: "Custom Button",
      functionName: "customButtonClicked",
    });

    form.addSubmitButton({
      label: "Process",
    });

    form.addResetButton({
      label: "Reset",
    });

    context.response.writePage(form);
  };

  const processForm = (context) => {
    const request = context.request;

    const name = request.parameters.custpage_test_as_name;

    const email = request.parameters.custpage_test_as_email;

    const status = request.parameters.custpage_test_as_status;

    const description = request.parameters.custpage_test_as_description;

    const lineCount = request.getLineCount({
      group: "custpage_test_as_customer_list",
    });

    const selectedCustomers = [];

    for (let i = 0; i < lineCount; i++) {
      const selected = request.getSublistValue({
        group: "custpage_test_as_customer_list",
        name: "custpage_test_as_select",
        line: i,
      });

      if (selected === "T") {
        const customerId = request.getSublistValue({
          group: "custpage_test_as_customer_list",
          name: "custpage_test_as_id",
          line: i,
        });

        selectedCustomers.push(customerId);
      }
    }

    log.audit({
      title: "Submitted Data",
      details: {
        name,
        email,
        status,
        description,
        selectedCustomers,
      },
    });

    redirect.toSuitelet({
      scriptId: "customscript_test_as_suitelet",
      deploymentId: "customdeploy_test_as_suitelet",

      parameters: {
        custparam_test_as_success: "T",
      },
    });
  };

  return {
    onRequest,
  };
});
