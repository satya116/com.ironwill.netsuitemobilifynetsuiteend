/**
 *@NApiVersion 2.1
 */

define(["N/https"], (https) => {
  function someExampleOfHttps() {
    https.post({
      url: "",
      body: JSON.stringify({
        name: "alex",
        email: "alex@gmail.com",
      }),
      headers: {
        Authorisation: "Bearer token",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
  }

  return {
    someExampleOfHttps: someExampleOfHttps,
  };
});


record.detach({
    record: {
        type: "",
        id: ""
    },
    from: {
        type: 
        id: 

    }
}) 
