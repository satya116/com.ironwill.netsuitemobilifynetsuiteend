/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */

define(["N/search"], (search) => {
  function getInputData() {
    return search.create({
      type: search.Type.SALES_ORDER,
      filters: [
        ["mainline", "is", "T"],
        "AND",
        ["status", "anyof", "SalesOrd:B"],
      ],
      columns: ["internalid", "entity", "total"],
    });
  }

  function map(context) {
    const salesOrder = JSON.parse(context.value);

    const customerId = salesOrder.values.entity.value;
    const total = salesOrder.values.total;

    context.write({
      key: customerId,
      value: total,
    });
  }

  function reduce(context) {
    const customerId = context.key;

    const total = context.values.reduce((sum, value) => {
      return sum + Number(value);
    }, 0);

    log.debug({
      title: `Customer ${customerId}`,
      details: `Total Pending Order Value: ${total}`,
    });
  }

  function summarize(summary) {
    log.audit({
      title: "Map/Reduce Completed",
      details: `Usage: ${summary.usage}, Yields: ${summary.yields}`,
    });

    if (summary.inputSummary.error) {
      log.error({
        title: "getInputData Error",
        details: summary.inputSummary.error,
      });
    }

    summary.mapSummary.errors.iterator().each((key, error) => {
      log.error({
        title: `Map Error - ${key}`,
        details: error,
      });

      return true;
    });

    summary.reduceSummary.errors.iterator().each((key, error) => {
      log.error({
        title: `Reduce Error - Customer ${key}`,
        details: error,
      });

      return true;
    });
  }

  return {
    getInputData,
    map,
    reduce,
    summarize,
  };
});
