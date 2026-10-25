/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */

define(["N/record", "N/search", "N/query", "N/https", "N/runtime"], (
  record,
  search,
  query,
  https,
  runtime,
) => {
  function _get(context) {
    log.debug({ title: "restlet get context", details: context });

    const recordType = context.recordType;

    if (!recordType) {
      return "Please mention record type";
    }

    const results = [];

    try {
      const searchArrayedResults = search
        .create({
          type: recordType,
          filters: [],
          columns: [],
        })
        .run()
        .getRange({
          start: 0,
          end: 100,
        });

      searchArrayedResults.forEach((result) => {
        results.push({ recordId: result.id });
      });

      return JSON.stringify(results);
    } catch (error) {
      log.debug({
        title: "Error kya hai ji",
        details: error,
      });

      if (error.name == "INVALID_RCRD_TYPE") {
        return "Please mention correct record type in query params";
      }

      return "Something went wrong";
    }
  }
  function _post(context) {
    const { recordType, filters, columns, pageSize, pageIndex } = context;

    log.debug({
      title: "POST called",
      details: context,
    });

    // log.debug({});
  }
  function _put() {}
  function _delete() {}

  return {
    get: _get,
    post: _post,
    delete: _delete,
    put: _put,
  };
});
