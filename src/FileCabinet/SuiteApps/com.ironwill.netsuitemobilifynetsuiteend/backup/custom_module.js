define([
  "N/record",
  "N/runtime",
  "N/search",
  "N/query",
  "N/config",
  "N/util",
  "N/https",
  "N/redirect",
], (
  record,
  runtime,
  search,
  query,
  config,
  util,
  https,
  redirect,
) => {
  function doSomething(args) {}

  function createandSaveAContactRecord(args) {
    const contactRecord = record.create({
      type: "contact",
      isDynamic: true,
    });

    contactRecord.setValue({
      fieldId: "subsidiary",
      value: "1",
    });

    const reocrdId = contactRecord.save({
      enableSourcing: false,
      ignoreMandatoryFields: true,
    });

    log.debug({
      title: "reocrdId",
      details: reocrdId,
    });
  }

  function createandSaveAContactRecordAsync(args) {
    const recordObjPromise = record.create.promise({
      type: "contact",
      isDynamic: true,
    });

    const nameData = {
      firstname: "John",
      middlename: "Doe",
      lastname: "Smith",
    };

    recordObjPromise
      .then((objRecord) => {
        objRecord.setValue({
          fieldId: "subsidiary",
          value: "1",
        });

        for (let key in nameData) {
          if (nameData.hasOwnProperty(key)) {
            objRecord.setValue({
              fieldId: key,
              value: nameData[key],
            });
          }
        }

        objRecord.save({
          enableSourcing: false,
          ignoreMandatoryFields: true,
        });
      })
      .catch((e) => {
        log.debug("Something went wrong", e.name);
        log.debug("Error Message", e.message);
      });
  }

  function accessSublistAndSubrecordFromRecord(args) {
    const rec = record.create({
      type: "purchaseorder",
      isDynamic: true,
    });
    rec.setValue({
      fieldId: "entity",
      value: 52,
    });
    rec.setValue({
      fieldId: "location",
      value: 2,
    });

    const sublistObj = rec.selectNewLine({
      sublistId: "item",
    });

    sublistObj.setCurrentSublistValue({
      fieldId: "quantity",
      value: "2",
    });

    sublistObj.setCurrentSublistValue({
      fieldId: "rate",
      value: "100",
    });

    const subrecordInvDetail = sublistObj.getCurrentSublistSubrecord({
      sublistId: "item",
      fieldId: "inventorydetail",
    });

    const SubrecordLine = subrecordInvDetail.selectNewLine({
      sublistId: "inventoryassignment",
    });

    SubrecordLine.setCurrentSublistValue({
      sublistId: "inventoryassignment",
      fieldId: "receiptinventorynumber",
      value: "myinventory",
    });

    SubrecordLine.commitLine({
      sublistId: "inventoryassignment",
    });

    rec.commitLine({
      sublistId: "item",
    });

    rec.save({
      enableSourcing: false,
      ignoreMandatoryFields: true,
    });
  }

  function whatIsRecordColumn(args) {}

  function letsCheckRecordDotField() {
    // Record.getField(options)
    // Record.getSublistField(options)
    // Record.getCurrentSublistField(options)
    // CurrentRecord.getField(options)
    // CurrentRecord.getSublistField(options)
    // Certain properties of Field objects are available only when working with a record in
    // dynamic mode.
    // Field.id - standard and dynamic modes
    // Field.isDisplay - dynamic mode only
    // Field.isMandatory - standard and dynamic modes
    // Field.label - standard and dynamic modes
    // Field.sublistId - dynamic mode only
    // Field.type - standard and dynamic modes
  }

  function letsCheckRecordDotRecord() {
    // Record.cancelLine(options)
  }

  function letsCheckQueryModule(args) {


    query.create({
        type: query.Type.SALES_ORDERED,
        columns: [],
        condition: [],
        sort: []
    });


}




  return {
    doSomething: doSomething,
    createandSaveAContactRecord: createandSaveAContactRecord,
    createandSaveAContactRecordAsync: createandSaveAContactRecordAsync,
    accessSublistAndSubrecordFromRecord: accessSublistAndSubrecordFromRecord,
    whatIsRecordColumn: whatIsRecordColumn,
    letsCheckRecordDotField: letsCheckRecordDotField,
    letsCheckRecordDotRecord: letsCheckRecordDotRecord,
    letsCheckQueryModule:  letsCheckQueryModule
  };
});
