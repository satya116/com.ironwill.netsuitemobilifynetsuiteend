/**
 *@NApiVersion 2.1
 *@NScriptType UserEventScript
 */

define(["N/ui/serverWidget"], (serverWidget) => {
  function beforeLoad(context) {
    const form = context.form;

    const helloword = {
      fname: "alex",
      lname: "john",
    };

    form.addButton({
      id: "custpage_test_as_btn",
      label: "Test Button",
      functionName: `getSomething(${JSON.stringify(helloword)})`,
    });

    form.clientScriptModulePath = "./test_as_client.js";
  }

  function beforeSubmit(context) {}
  function afterSubmit(context) {}

  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    afterSubmit: afterSubmit,
  };
});
