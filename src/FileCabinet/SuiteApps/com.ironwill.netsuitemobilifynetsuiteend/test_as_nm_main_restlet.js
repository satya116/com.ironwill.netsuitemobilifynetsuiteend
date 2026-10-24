/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 */

define(["N/record", "N/search", "./test_as_nm_record_metadata"], (
  record,
  search,
  recordMetadata,
) => {
  function normalizeColumns(fields) {
    if (!fields) {
      return [{ id: "internalid", column: search.createColumn({ name: "internalid" }) }];
    }

    if (typeof fields === "string") {
      return fields
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean)
        .map((id) => ({ id, column: search.createColumn({ name: id }) }));
    }

    if (Array.isArray(fields)) {
      return fields
        .map((field) => {
          const id = typeof field === "string" ? field : field.id || field.name;
          return id ? { id, column: search.createColumn({ name: id }) } : null;
        })
        .filter((field) => field !== null);
    }

    return [{ id: "internalid", column: search.createColumn({ name: "internalid" }) }];
  }

  function buildFilters(context) {
    const filters = [];
    const filteredBy = context.filteredBy || context.filterBy;
    const filterValue = context.filterValue || context.filteredByValue;

    if (context.recordId) {
      filters.push(["internalid", search.Operator.ANYOF, context.recordId]);
    }

    if (filteredBy && filterValue !== undefined && filterValue !== null) {
      if (filters.length > 0) {
        filters.push("AND");
      }

      filters.push([
        filteredBy,
        getSearchOperator(context.filterOperator),
        filterValue,
      ]);
    }

    if (Array.isArray(context.filters) && context.filters.length > 0) {
      if (filters.length > 0) {
        filters.push("AND");
      }

      filters.push(context.filters);
    }

    return filters;
  }

  function getSearchOperator(operatorName) {
    if (!operatorName) {
      return search.Operator.IS;
    }

    return (
      search.Operator[String(operatorName).toUpperCase()] || search.Operator.IS
    );
  }

  function readSearchResult(result, columns) {
    const row = {
      id: result.id,
      recordType: result.recordType,
    };

    columns.forEach(({ id, column }) => {
      let value = null;
      let text = null;

      try {
        value = result.getValue(column);
      } catch (error) {
        try {
          value = result.getValue({ name: id });
        } catch (fallbackError) {
          log.debug({ title: "Unable to read search value", details: { id, error: fallbackError } });
        }
      }

      try {
        text = result.getText(column);
      } catch (error) {
        try {
          text = result.getText({ name: id });
        } catch (fallbackError) {
          // getText is not supported for every field type; the raw value is enough.
        }
      }

      row[id] = { value, text };
    });

    return row;
  }

  function getSearchFunctionRecords(context) {
    const recordType = context.recordType;
    const functionType = context.functionType || "view";

    if (!recordType) {
      return {
        success: false,
        message: "recordType is required",
      };
    }

    const columns = normalizeColumns(context.fields || context.columns);
    const pageSize = Number(context.pageSize || 100);
    const pageIndex = Number(context.pageIndex || 0);
    const start = pageIndex * pageSize;
    const end = start + pageSize;

    const searchResults = search
      .create({
        type: recordType,
        filters: buildFilters(context),
        columns: columns.map(({ column }) => column),
      })
      .run()
      .getRange({
        start,
        end,
      });

    return {
      success: true,
      functionType,
      recordType,
      filteredBy: context.filteredBy || context.filterBy || null,
      filterValue: context.filterValue || context.filteredByValue || null,
      fields: columns.map(({ id }) => id),
      pageIndex,
      pageSize,
      results: searchResults.map((result) => readSearchResult(result, columns)),
    };
  }

  function updateEditFunctionRecord(context) {
    const recordType = context.recordType;
    const recordId = context.recordId || context.id;
    const values = context.values || context.fields;

    if (!recordType || !recordId) {
      return {
        success: false,
        message: "recordType and recordId are required",
      };
    }

    if (!values || typeof values !== "object" || Array.isArray(values)) {
      return {
        success: false,
        message: "values object is required",
      };
    }

    const loadedRecord = record.load({
      type: recordType,
      id: recordId,
      isDynamic: false,
    });

    Object.keys(values).forEach((fieldId) => {
      loadedRecord.setValue({
        fieldId,
        value: values[fieldId],
      });
    });

    const savedRecordId = loadedRecord.save({
      enableSourcing: true,
      ignoreMandatoryFields: false,
    });

    return {
      success: true,
      functionType: "edit",
      recordType,
      recordId: savedRecordId,
    };
  }

  function createFunctionRecord(context) {
    const recordType = context.recordType;
    const values = context.values || context.fields;

    if (!recordType) {
      return {
        success: false,
        message: "recordType is required",
      };
    }

    if (!values || typeof values !== "object" || Array.isArray(values)) {
      return {
        success: false,
        message: "values object is required",
      };
    }

    const newRecord = record.create({
      type: recordType,
      isDynamic: false,
    });

    Object.keys(values).forEach((fieldId) => {
      newRecord.setValue({
        fieldId,
        value: values[fieldId],
      });
    });

    const recordId = newRecord.save({
      enableSourcing: true,
      ignoreMandatoryFields: false,
    });

    return {
      success: true,
      functionType: "create",
      recordType,
      recordId,
    };
  }

  function _get(context) {
    log.debug({
      title: "netsuite_mobilify_main_restlet GET",
      details: context,
    });

    try {
      if (context.action === "recordTypes") {
        return recordMetadata.getRecordTypes();
      }

      if (
        context.functionType &&
        context.functionType !== "view" &&
        context.functionType !== "list" &&
        context.functionType !== "edit"
      ) {
        return {
          success: false,
          message: "Only view, list, and edit function GET are supported",
        };
      }

      return getSearchFunctionRecords(context);
    } catch (error) {
      log.error({
        title: "View function GET failed",
        details: error,
      });

      return {
        success: false,
        message: error.message || "Something went wrong",
        name: error.name,
      };
    }
  }

  function _put(context) {
    log.debug({
      title: "netsuite_mobilify_main_restlet PUT",
      details: context,
    });

    try {
      if (context.functionType && context.functionType !== "edit") {
        return {
          success: false,
          message: "Only edit function PUT is supported",
        };
      }

      return updateEditFunctionRecord(context);
    } catch (error) {
      log.error({
        title: "Edit function PUT failed",
        details: error,
      });

      return {
        success: false,
        message: error.message || "Something went wrong",
        name: error.name,
      };
    }
  }

  function _post(context) {
    log.debug({
      title: "netsuite_mobilify_main_restlet POST",
      details: context,
    });

    try {
      if (context.functionType && context.functionType !== "create") {
        return {
          success: false,
          message: "Only create function POST is supported",
        };
      }

      return createFunctionRecord(context);
    } catch (error) {
      log.error({
        title: "Create function POST failed",
        details: error,
      });

      return {
        success: false,
        message: error.message || "Something went wrong",
        name: error.name,
      };
    }
  }

  return {
    get: _get,
    post: _post,
    put: _put,
  };
});
