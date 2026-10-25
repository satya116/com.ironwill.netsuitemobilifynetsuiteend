/**
 *@NScriptType Suitelet
 *@NApiversion 2.1
 */


define (["N/search"], (search) => {

    // search.create()
    // search.load()
    // All returns search.Search object.

    const soSearch = search.create({

    });

    // soSearch.run() => search.ResultSet => .each() 
    // soSearch.runPaged({
    //     pageSize: 1000
    // }) => search.PageData

    soSearch.save()
    soSearch.columns
    soSearch.filters
    soSearch.filterExpression
    soSearch.id
    soSearch.searchType
    soSearch.settings
    soSearch.packageId
    soSearch.title
    soSearch.isPublic










}) 