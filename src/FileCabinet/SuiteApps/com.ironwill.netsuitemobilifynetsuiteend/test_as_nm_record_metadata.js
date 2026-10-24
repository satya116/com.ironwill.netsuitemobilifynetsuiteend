/**
 *@NApiVersion 2.1
 *@NModuleScope Public
 */
define(["N/query"], (query) => {
  function getRecordTypes() {
    const results = query
      .runSuiteQL({
        query: "SELECT name, skey FROM scriptrecordtype ORDER BY name",
      })
      .asMappedResults();

    return {
      success: true,
      recordTypes: results
        .filter((item) => item.skey)
        .map((item) => ({
          id: String(item.skey).toLowerCase(),
          label: String(item.name || item.skey),
        })),
    };
  }

  return { getRecordTypes };
});
