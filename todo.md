ue > cs > suitelet

form.clientScriptModulePath
form.clientScriptFileId

window.open("suiteleturl",... )

iframe

/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url'], (url) => {

  const pageInit = () => {};

  const openModal = () => {
    const suiteletUrl = url.resolveScript({
      scriptId: 'customscript_my_suitelet',
      deploymentId: 'customdeploy_my_suitelet'
    });

    const overlay = document.createElement('div');

    overlay.id = 'custpage_suitelet_modal';

    overlay.innerHTML = `
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

    document.body.appendChild(overlay);

    document
      .getElementById('custpage_close_modal')
      .addEventListener('click', () => {
        overlay.remove();
      });
  };

  return {
    pageInit,
    openModal
  };
});


The following capabilities are available when you use SuiteScript 2.1:
■ Map/Reduce Script Type
■ Asynchronous Processing with Promises
■ SFTP File Transfer API
■ Cache API
■ Search Pagination API
■ Flat File Streaming API
■ HTTP Content Type Header Support
■ Encryption and Encoding Functionality