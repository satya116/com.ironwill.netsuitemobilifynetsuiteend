
/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(["N/search", "N/record", "N/runtime", "N/task", "N/log"], (
  search,
  record,
  runtime,
  task,
  log
) => {
  const REVIEW_FIELD = "custbody_test_as_review_required";
  const AMOUNT_PARAM = "custscript_test_as_min_amount";
  const LAST_ID_PARAM = "custscript_test_as_last_id";

  function reschedule(script, lastId) {
    const scheduledTask = task.create({
      taskType: task.TaskType.SCHEDULED_SCRIPT
    });

    scheduledTask.scriptId = script.id;
    scheduledTask.deploymentId = script.deploymentId;
    scheduledTask.params = {
      [LAST_ID_PARAM]: String(lastId)
    };

    const taskId = scheduledTask.submit();

    log.audit({
      title: "Scheduled continuation",
      details: { lastId, taskId }
    });
  }

  function execute() {
    const script = runtime.getCurrentScript();

    const minimumAmount = Number(
      script.getParameter({ name: AMOUNT_PARAM })
    );

    let lastId = Number(
      script.getParameter({ name: LAST_ID_PARAM }) || 0
    );

    if (!Number.isFinite(minimumAmount) || minimumAmount < 0) {
      throw new Error("Minimum amount must be a valid non-negative number.");
    }

    let processed = 0;
    let failed = 0;

    const salesOrderSearch = search.create({
      type: search.Type.SALES_ORDER,
      filters: [
        ["mainline", "is", "T"],
        "AND",
        ["status", "anyof", "SalesOrd:B"],
        "AND",
        ["amount", "greaterthan", minimumAmount],
        "AND",
        ["internalidnumber", "greaterthan", lastId]
      ],
      columns: [
        search.createColumn({
          name: "internalid",
          sort: search.Sort.ASC
        })
      ]
    });

    const pagedData = salesOrderSearch.runPaged({
      pageSize: 1000
    });

    for (const pageRange of pagedData.pageRanges) {
      const page = pagedData.fetch({
        index: pageRange.index
      });

      for (const result of page.data) {
        const orderId = Number(result.id);

        if (script.getRemainingUsage() < 200) {
          reschedule(script, lastId);
          return;
        }

        try {
          record.submitFields({
            type: record.Type.SALES_ORDER,
            id: orderId,
            values: {
              [REVIEW_FIELD]: true
            },
            options: {
              enableSourcing: false,
              ignoreMandatoryFields: true
            }
          });

          processed++;

          log.debug({
            title: "Sales Order flagged",
            details: orderId
          });
        } catch (error) {
          failed++;

          log.error({
            title: `Failed Sales Order ${orderId}`,
            details: error
          });
        }

        // Advance the checkpoint after handling this record.
        lastId = orderId;
      }
    }

    log.audit({
      title: "Scheduled Script completed",
      details: {
        processed,
        failed,
        lastId,
        remainingUsage: script.getRemainingUsage()
      }
    });
  }

  return { execute };
});
