/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */

define(["N/https", "N/ui/serverWidget", "N/url"], (https, serverWidget, url) => {
  function onRequest(context) {


    const customerRec = url.resolveRecord({
      recordType: "customer",
      recordId: "14778",
      isEditMode: true,
    });

    const domainName = url.resolveDomain({
      hostType: url.HostType.APPLICATION
    });

    log.debug({
      title: "customerRec",
      details: customerRec,
    });

    log.debug({
      title: "domainName",
      details: domainName,
    });

    log.debug({
      title: "suitelet context",
      details: context,
    });

    const form = serverWidget.createForm({
      title: "Test Suitelet form",
      hideNavBar: true,
    });

    context.response.writePage(form);
  }

  return {
    onRequest: onRequest,
  };
});
