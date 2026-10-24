/**
 *@NApiVersion 2.1
 *
 */

define(["N/query"], (query) => {
  function someFn(args) {
    customerQuery = query.create({
      type: query.Type.CUSTOMER,
    });

    customerQuery.columns = [
      customerQuery.createColumn({ fieldId: "internalid" }),
      customerQuery.createColumn({ fieldId: "entityid" }),
      customerQuery.createColumn({ fieldId: "email" }),
    ];

    customerQuery.condition = customerQuery.createCondition({
      fieldId: "entityid",
      operator: query.Operator.CONTAIN,
      values: ["QA trailing", "AB&I Holdings", "Amanda J Rogers"],
      caseSensitive: false,
    });

    const mappedQueryResult = customerQuery.run().asMappedResults();

    mappedQueryResult.forEach((result) => {
      console.log({
        "Entity Id hai": result.entityid,
        "internalid Id hai": result.internalid,
        "Email Id hai": result.email,
      });
    });
  }

  function someFn2(args) {
    const customerQ = query.create({
      type: query.Type.CUSTOMER,
    });

    const cond1 = customerQ.createCondition({
      fieldId: "entityid",
      operator: query.Operator.ANY_OF,
      values: ["191937", "ABC Company"],
    });
    const cond2 = customerQ.createCondition({
      fieldId: "email",
      operator: query.Operator.EMPTY_NOT,
    });

    customerQ.columns = [
      customerQ.createColumn({ fieldId: "email" }),
      customerQ.createColumn({ fieldId: "entityid" }),
    ];

    customerQ.condition = cond1.and(cond2);

    customerQ
      .run()
      .asMappedResults()
      .forEach((result) => {
        console.log(result);
      });
  }

  function runSQLfromNetSuite () {

    suiteQLResultSet = query.runSuiteQL({
        query: `SELECT id, entityid, email 
                FROM customer
                WHERE email = ?
                AND id > ?
                SORT BY entityid ASC
                FETCH FIRST 20 ROWS ONLY
                `,
        params: ["alex@gmail.com", 1000],
    });

    suiteQLResultSet.asMappedResults().forEach((result) => {

    });

  }



  return {
    someFn: someFn,
    someFn2: someFn2,
    runSQLfromNetSuite: runSQLfromNetSuite,
  };
});
