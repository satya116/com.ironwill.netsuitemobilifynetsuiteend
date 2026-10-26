/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(["N/search", "N/record", "N/runtime", "N/log"], (
  search,
  record,
  runtime,
  log,
) => {
  const CREDIT_REVIEW_FIELD = "custbody_test_as_credit_review";
  const AUDIT_TYPE = "customrecord_test_as_credit_audit";

  function getInputData() {
    return search.create({
      type: search.Type.SALES_ORDER,
      filters: [
        ["mainline", "is", "T"],
        "AND",
        ["status", "anyof", "SalesOrd:A", "SalesOrd:B"],
      ],
      columns: [
        search.createColumn({ name: "entity" }),
        search.createColumn({ name: "total" }),
      ],
    });
  }

  function getValue(value) {
    if (value && typeof value === "object" && "value" in value) {
      return value.value;
    }
    return value;
  }

  function map(context) {
    const result = JSON.parse(context.value);
    const customerId = getValue(result.values.entity);
    const total = Number(getValue(result.values.total)) || 0;

    if (!result.id || !customerId) {
      throw new Error(
        `Missing Sales Order ID or customer ID: ${context.value}`,
      );
    }

    context.write({
      key: String(customerId),
      value: JSON.stringify({
        orderId: String(result.id),
        total,
      }),
    });
  }

  function getCreditLimit(customerId) {
    const fields = search.lookupFields({
      type: search.Type.CUSTOMER,
      id: customerId,
      columns: ["creditlimit"],
    });

    const raw = fields.creditlimit;
    const limit = Number(raw);

    if (raw === null || raw === "" || !Number.isFinite(limit) || limit <= 0) {
      return null;
    }

    return limit;
  }

  function upsertAudit(customerId, pendingAmount, creditLimit, affectedCount) {
    const auditKey = `CUSTOMER:${customerId}`;

    const existing = search
      .create({
        type: AUDIT_TYPE,
        filters: [["custrecord_test_as_audit_key", "is", auditKey]],
        columns: [search.createColumn({ name: "internalid" })],
      })
      .run()
      .getRange({
        start: 0,
        end: 1,
      });

    const values = {
      custrecord_test_as_audit_key: auditKey,
      custrecord_test_as_customer: customerId,
      custrecord_test_as_pending_amount: pendingAmount,
      custrecord_test_as_credit_limit: creditLimit,
      custrecord_test_as_affected_count: affectedCount,
    };

    if (existing.length > 0) {
      record.submitFields({
        type: AUDIT_TYPE,
        id: existing[0].getValue({ name: "internalid" }),
        values,
        options: {
          enableSourcing: false,
          ignoreMandatoryFields: false,
        },
      });
      return;
    }

    const audit = record.create({
      type: AUDIT_TYPE,
      isDynamic: false,
    });

    Object.keys(values).forEach((fieldId) => {
      audit.setValue({
        fieldId,
        value: values[fieldId],
      });
    });

    audit.save({
      enableSourcing: false,
      ignoreMandatoryFields: false,
    });
  }

  function reduce(context) {
    const customerId = context.key;
    const orders = context.values.map((value) => JSON.parse(value));

    const pendingAmount = orders.reduce((sum, order) => sum + order.total, 0);

    const creditLimit = getCreditLimit(customerId);

    const hasCreditLimit = creditLimit !== null;
    const exceedsLimit = hasCreditLimit && pendingAmount > creditLimit;

    let affectedCount = 0;
    let failedCount = 0;

    orders.forEach((order) => {
      try {
        record.submitFields({
          type: record.Type.SALES_ORDER,
          id: Number(order.orderId),
          values: {
            [CREDIT_REVIEW_FIELD]: exceedsLimit,
          },
          options: {
            enableSourcing: false,
            ignoreMandatoryFields: false,
          },
        });

        if (exceedsLimit) {
          affectedCount++;
        }
      } catch (error) {
        failedCount++;

        log.error({
          title: `Failed to update Sales Order ${order.orderId}`,
          details: error,
        });
      }
    });

    if (exceedsLimit) {
      upsertAudit(customerId, pendingAmount, creditLimit, affectedCount);
    }

    context.write({
      key: customerId,
      value: JSON.stringify({
        hasCreditLimit,
        pendingAmount,
        creditLimit,
        flagged: exceedsLimit,
        affectedCount,
        failedCount,
      }),
    });

    log.debug({
      title: `Customer ${customerId}`,
      details: {
        remainingUsage: runtime.getCurrentScript().getRemainingUsage(),
        pendingAmount,
        creditLimit,
        exceedsLimit,
        affectedCount,
        failedCount,
      },
    });
  }

  function summarize(summary) {
    if (summary.inputSummary.error) {
      log.error({
        title: "Input stage failed",
        details: summary.inputSummary.error,
      });
    }

    summary.mapSummary.errors.iterator().each((key, error, executionNo) => {
      log.error({
        title: `Map error: ${key}, attempt ${executionNo}`,
        details: error,
      });
      return true;
    });

    summary.reduceSummary.errors.iterator().each((key, error, executionNo) => {
      log.error({
        title: `Reduce error: ${key}, attempt ${executionNo}`,
        details: error,
      });
      return true;
    });

    const totals = {
      customersProcessed: 0,
      customersFlagged: 0,
      ordersFlagged: 0,
      orderUpdateFailures: 0,
      customersWithoutCreditLimit: 0,
    };

    summary.output.iterator().each((key, value) => {
      const result = JSON.parse(value);

      totals.customersProcessed++;

      if (result.flagged) {
        totals.customersFlagged++;
      }

      totals.ordersFlagged += result.affectedCount;
      totals.orderUpdateFailures += result.failedCount;

      if (!result.hasCreditLimit) {
        totals.customersWithoutCreditLimit++;
      }

      return true;
    });

    log.audit({
      title: "Map/Reduce Summary",
      details: {
        ...totals,
        usage: summary.usage,
        yields: summary.yields,
        seconds: summary.seconds,
      },
    });
  }

  return {
    getInputData,
    map,
    reduce,
    summarize,
  };
});
