/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(["N/record", "N/search", "N/error", "N/log"], (
  record,
  search,
  error,
  log,
) => {
  const APPROVAL_FIELD = "custbody_test_as_approval_status";
  const PROCESSED_FIELD = "custbody_test_as_processed";
  const AUDIT_RECORD = "customrecord_test_as_so_audit";

  function beforeLoad(context) {
    log.debug({
      title: "beforeLoad ctx",
      details: context,
    });

    if (context.type !== context.UserEventType.VIEW) {
      return;
    }

    // context.newRecord;
    // rec.getValue();

    const rec = context.newRecord;
    const customerId = rec.getValue({
      fieldId: "custrecord_test_as_cust",
    });

    log.debug({
      title: "beforeLoad customerId",
      details: customerId,
    });

    if (!customerId) {
      return;
    }

    // context.form.clientScriptModulePath = "./wjkgkwje.js";
    // context.form.addButton({
    //   id: "",
    //   label: "",
    //   functionName: "viewCustomerCredit",
    // });

    context.form.clientScriptModulePath = "./test_as_credit_client.js";

    context.form.addButton({
      id: "custpage_test_as_credit",
      label: "View Customer Credit",
      functionName: 'viewCustomerCredit(123,"someString", true)',
    });
  }

  function beforeSubmit(context) {
    const allowedTypes = [
      context.UserEventType.CREATE,
      context.UserEventType.EDIT,
    ];

    if (!allowedTypes.includes(context.type)) {
      return;
    }

    const rec = context.newRecord;

    const customerId = rec.getValue({
      fieldId: "",
    });

    const approvalStatus = rec.getValue({
      fieldId: APPROVAL_FIELD,
    });

    const total = Number(
      rec.getValue({
        fieldId: "total",
      }) || 0,
    );

    if (!customerId) {
      throw error.create({
        name: "CUSTOMER_REQUIRED",
        message: "A customer must be selected.",
      });
    }

    if (
      approvalStatus === null ||
      approvalStatus === undefined ||
      approvalStatus === ""
    ) {
      throw error.create({
        name: "APPROVAL_STATUS_REQUIRED",
        message: "Approval Status is required.",
      });
    }

    const ejhdgfj = search.lookupFields({
      type: "",
      id: customerId,
      columns: ["dmnbvje",edghej]
    });

    ejhdgfj.dmnbvje;

    const customerData = search.lookupFields({
      type: search.Type.CUSTOMER,
      id: customerId,
      columns: ["creditlimit"],
    });

    const creditLimitValue = customerData.creditlimit;

    if (
      creditLimitValue === null ||
      creditLimitValue === undefined ||
      creditLimitValue === ""
    ) {
      throw error.create({
        name: "CREDIT_LIMIT_MISSING",
        message: "The selected customer has no configured credit limit.",
      });
    }

    const creditLimit = Number(creditLimitValue);

    if (!Number.isFinite(creditLimit) || creditLimit < 0) {
      throw error.create({
        name: "INVALID_CREDIT_LIMIT",
        message: "The customer credit limit is invalid.",
      });
    }

    if (total > creditLimit) {
      throw error.create({
        name: "CREDIT_LIMIT_EXCEEDED",
        message:
          "Sales Order total (" +
          total +
          ") exceeds customer credit limit (" +
          creditLimit +
          ").",
      });
    }

    rec.setValue({
      fieldId: PROCESSED_FIELD,
      value: true,
    });
  }

  function afterSubmit(context) {
    if (context.type !== context.UserEventType.CREATE) {
      return;
    }

    const rec = context.newRecord;
    const salesOrderId = rec.id;

    if (!salesOrderId) {
      return;
    }

    try {
      const existingAudit = search
        .create({
          type: AUDIT_RECORD,
          filters: [
            ["custrecord_test_as_so_internal_id", "is", String(salesOrderId)],
          ],
          columns: ["internalid"],
        })
        .run()
        .getRange({
          start: 0,
          end: 1,
        });

      if (existingAudit.length > 0) {
        log.audit({
          title: "Audit Already Exists",
          details: "Sales Order " + salesOrderId,
        });

        return;
      }

      const customerId = rec.getValue({
        fieldId: "entity",
      });

      const total = Number(
        rec.getValue({
          fieldId: "total",
        }) || 0,
      );

      const audit = record.create({
        type: AUDIT_RECORD,
        isDynamic: false,
      });

      audit.setValue({
        fieldId: "custrecord_test_as_so_internal_id",
        value: String(salesOrderId),
      });

      if (customerId) {
        audit.setValue({
          fieldId: "custrecord_test_as_customer",
          value: Number(customerId),
        });
      }

      audit.setValue({
        fieldId: "custrecord_test_as_total",
        value: total,
      });

      audit.setValue({
        fieldId: "custrecord_test_as_timestamp",
        value: new Date(),
      });

      const auditId = audit.save({
        enableSourcing: true,
        ignoreMandatoryFields: false,
      });

      log.audit({
        title: "Sales Order Audit Created",
        details: {
          salesOrderId: salesOrderId,
          auditId: auditId,
        },
      });
    } catch (e) {
      log.error({
        title: "Sales Order Audit Failed",
        details: {
          salesOrderId: salesOrderId,
          error: e.message || String(e),
        },
      });
    }
  }

  return {
    beforeLoad: beforeLoad,
    beforeSubmit: beforeSubmit,
    // afterSubmit: afterSubmit,
  };
});
