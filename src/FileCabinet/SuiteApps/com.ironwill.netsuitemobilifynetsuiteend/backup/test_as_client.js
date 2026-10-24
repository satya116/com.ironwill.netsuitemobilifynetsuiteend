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

    const overlayElement = document.createElement("div");

    overlayElement.id = "custpage_suitelet_modal";

    overlayElement.innerHTML = `
      <div style="
        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.45);
        z-index:99999;
        display:flex;
        justify-content:center;
        align-items:center;
      ">
        <div style="
          width:700px;
          height:500px;
          background:white;
          border-radius:8px;
          overflow:hidden;
          box-shadow:0 5px 25px rgba(0,0,0,.3);
        ">

          <div style="
            height:45px;
            display:flex;
            justify-content:space-between;
            align-items:center;
            padding:0 15px;
            border-bottom:1px solid #ddd;
          ">
            <strong>My Suitelet</strong>

            <button
              id="custpage_close_modal"
              type="button"
              style="
                border:none;
                background:none;
                font-size:22px;
                cursor:pointer;
              ">
              ×
            </button>
          </div>

          <iframe
            src="${suiteletUrl}"
            style="
              width:100%;
              height:calc(100% - 45px);
              border:none;
            ">
          </iframe>

        </div>
      </div>
    `;

    document.body.appendChild(overlayElement);

    document
      .getElementById("custpage_close_modal")
      .addEventListener("click", () => {
        overlayElement.remove();
      });
  }

  return {
    pageInit: pageInit,
    getSomething: getSomething,
  };
});
