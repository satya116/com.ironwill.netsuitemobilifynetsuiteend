
/**
 * @NApiVersion 2.1
 * @NScriptType WorkflowActionScript
 */
define(["N/runtime", "N/log"], (runtime, log) => {
  const MAX_QTY_PARAM = "custscript_test_as_max_qty";

  function onAction(context) {
    const script = runtime.getCurrentScript();
    const salesOrder = context.newRecord;

    try {
      const maxQuantity = Number(
        script.getParameter({
          name: MAX_QTY_PARAM
        })
      );

      if (!Number.isFinite(maxQuantity) || maxQuantity <= 0) {
        throw new Error("Maximum quantity must be a positive number.");
      }

      const lineCount = salesOrder.getLineCount({
        sublistId: "item"
      });

      let isValid = true;

      for (let line = 0; line < lineCount; line++) {
        const itemId = salesOrder.getSublistValue({
          sublistId: "item",
          fieldId: "item",
          line
        });

        const quantity = Number(
          salesOrder.getSublistValue({
            sublistId: "item",
            fieldId: "quantity",
            line
          })
        );

        if (quantity > maxQuantity) {
          isValid = false;

          log.audit({
            title: "Quantity validation failed",
            details: {
              salesOrderId: salesOrder.id,
              line: line + 1,
              itemId,
              quantity,
              maxQuantity
            }
          });

          break;
        }
      }

      const result = isValid ? 1 : 0;

      log.debug({
        title: "Workflow validation result",
        details: {
          salesOrderId: salesOrder.id,
          lineCount,
          result
        }
      });

      return result;
    } catch (error) {
      log.error({
        title: "Sales Order validation failed",
        details: error
      });

      throw error;
    }
  }

  return { onAction };
});
