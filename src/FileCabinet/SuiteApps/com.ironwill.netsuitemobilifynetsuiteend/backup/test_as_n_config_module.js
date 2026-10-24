/**
 *@NApiVersion 2.1
 *
 */

define(["N/config"], (config) => {
  function someExampleOfNConfig() {

    const compRec = config.load({
        type: config.Type.COMPANY_INFORMATION,      
    });

    const companyname = compRec.getValue({
        field: "companyname"
    });

    const UserPRec = config.load({
        type: config.Type.USER_PREFERENCES,
    });

    const dfhjhf = UserPRec.getValue({
        fieldId: "somefieldid"
    });



  }
  return {
    someExampleOfNConfig: someExampleOfNConfig,
  };
});
