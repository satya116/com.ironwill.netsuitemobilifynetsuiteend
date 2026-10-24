/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */

define(["N/url"], (url) => {
  function pageInit(context) {
    console.log("pageinit context", context);
  }

  function getSomething(args) {
    console.log("hello there", typeof args);

    const suiteletUrl = url.resolveScript({
      deploymentId: "customdeploy_test_as_suitelet",
      scriptId: "customscript_test_as_suitelet",
    });

    window.open(suiteletUrl, "someTargetWindowName");
  }

  return {
    pageInit: pageInit,
    getSomething: getSomething,
  };
});
