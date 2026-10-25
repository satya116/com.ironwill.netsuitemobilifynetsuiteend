/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(["N/currentRecord", "N/url"], (currentRecord, url) => {
  function pageInit(context) {}

  function viewCustomerCredit() {
    const rec = currentRecord.get();

    console.log("rec", rec);

    const customerId = rec.getValue({
      fieldId: "custrecord_test_as_cust",
    });

    console.log("customerId", customerId);

    if (!customerId) {
      alert("No customer is selected.");
      return;
    }

    const customerUrl = url.resolveRecord({
      recordType: "customer",
      recordId: customerId,
      isEditMode: false,
    });

    window.open(customerUrl, "_blank");
  }

  return {
    pageInit: pageInit,
    viewCustomerCredit: viewCustomerCredit,
  };
});
