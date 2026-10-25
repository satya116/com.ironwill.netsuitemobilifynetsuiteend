/**
 *@NScriptType ClientScript
 *@NApiVersion 2.1
 */
define(["N/currentRecord", "N/ui/dialog"], (currentRecordd, dialog) => {
  const pageInit = (context) => {
    const mode = context.mode;
    const cRecord = context.currentRecord;

    if (mode === "create") {
      cRecord.setValue({
        fieldId: "custrecord_test_as_doctor_consult_fee",
        value: 1000,
      });
    }

    console.log("context", context);

    // mode => edit/create

    dialog.alert({
      title: "Doctor Record",
      message: `Doctor Record pageInit run, mode: ${mode} `,
    });
  };

  const fieldChanged = (context) => {
    console.log("fieldChanged context", context);

    if (
      context.fieldId == "custrecord_test_as_doctor_phone" &&
      context.currentRecord.getValue({
        fieldId: "custrecord_test_as_doctor_phone",
      }).length != 13
    ) {
      dialog.confirm({
        title: "Phone Number Error",
        message:
          "Phone Number should be of 13 character including country code",
      });
    }
  };

  const saveRecord = (context) => {
    console.log("context", context);

    const cfee =
      context.currentRecord.getValue({
        fieldId: "custrecord_test_as_doctor_consult_fee",
      }) || "";
    if (!cfee) {
      dialog.confirm({
        title: "Consultation fee value is required",
        message: "Consultation fee value is required",
      });

      return false;
    } else {
      return true;
    }
  };

  const validateField = (context) => {
    console.log("validateField context", context);

    return true;
  };

  const postSourcing = (context) => {
    // works on transaction record only.
    console.log("postSourcing context", context);

    if (context.fieldId == "custrecord_test_as_cust") {
      const custu = context.currentRecord.getValue({
        fieldId: "custrecord_test_as_cust",
      });

      if (custu) {
        context.currentRecord.setValue({
          fieldId: "custrecord_test_as_doctor_consult_fee",
          value: 50000,
        });
      }
    }
  };

  return {
    fieldChanged,
    // lineInit,
    pageInit,
    postSourcing,
    saveRecord,
    // sublistChanged,
    // validateDelete,
    validateField,
    // validateInsert,
    // validateLine,
  };
});
