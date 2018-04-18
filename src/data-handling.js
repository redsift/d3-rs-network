     export function category(d) {
        // logic
        return GROUP[d.group].metadata;
      }

    export  function tryGetChildren(idObj){
        if (idObj.includes("mac")){
        return MAC_TO_IP[idObj];
        } else if (idObj.includes("guid")){
          return GUID_TO_MAC[idObj];          
        }
      }

    export  function tryGetParent(idObj){
        if (idObj.includes("mac")){
        return MAC_TO_GUID[idObj];
        } else if (idObj.includes("ip")){
          return IP_To_MAC[idObj];          
        }
      }
