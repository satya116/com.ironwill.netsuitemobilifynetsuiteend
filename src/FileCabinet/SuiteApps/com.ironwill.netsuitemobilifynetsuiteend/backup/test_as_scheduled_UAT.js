/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */

define(["N/record", "N/runtime"], (record, runtime) => {
  function execute(context) {
    for (let x = 0; x < 2; x++) {
      const currentScript = runtime.getCurrentScript().getRemainingUsage();

      if (currentScript < 50) {
        break;
      }

      record
        .create({
          type: "putsomecustomrecordtype",
          isDynamic: false,
        })
        .save({
          ignoreMandatoryFields: true,
          enableSourcing: false,
        });
    }
  }

  return {
    execute: execute,
  };
});
