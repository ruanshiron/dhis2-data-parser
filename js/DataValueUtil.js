var p2ild = p2ild || {
    /**Create by P2ild
     *  Custom report */
}

p2ild['dvu'] = dvu();

function dvu() {
    /**
     * dataValueUtil
     */

    function getValueDE(jsonDhis, de, org, typeOfData, isConvertToNumberWithThousand) {
        /*
        @param jsonDhis: return api from dhis. Ex: api/analystic.jsonDhis .... 
        @param de:
            option 1 : String(de UID) 
            option 2 : Array String
        @param valueReturn:
        */

        let dh = defineHeader(jsonDhis.headers);
        var valueReturn;
        if (jsonDhis.rows.length == 0) {
            return 0;
        }

        //Multi DE
        if (de instanceof Array) {
            valueReturn = 0;
            de.forEach(function(deItem) {
                for (var i = 0; i < jsonDhis.rows.length; i++) {
                    if (jsonDhis.rows[i][dh.iDe] == deItem &&
                        jsonDhis.rows[i][dh.iOu] == org) {
                        var value = jsonDhis.rows[i][dh.iValue];
                        valueReturn += defineValueWithTypeData(value, typeOfData);
                    }
                }
            });
        }
        //Single DE
        else {
            valueReturn = 0;
            for (var i = 0; i < jsonDhis.rows.length; i++) {
                if (jsonDhis.rows[i][dh.iDe] == de && jsonDhis.rows[i][dh.iOu] == org) {
                    valueReturn += defineValueWithTypeData(jsonDhis.rows[i][dh.iValue], typeOfData);
                }
            }
        }
        valueReturn == null ? 0 : valueReturn;
        if (isConvertToNumberWithThousand != undefined || isConvertToNumberWithThousand == false) {
            return valueReturn
        } else {
            return numberWithThousands(valueReturn)
        }
    }

    var getLastesPeriodValueByAncestor = function(json, de, ou, isConvertToNumberWithThousand) {
        /**
         * INPUT:
         * require json is output from remapResultByAncestor()
         * require dimension pe (exam: ..api/../dimension=dx:...&demension=pe:...)
         * 
         * OUTPUT:
         * return value of the last @param periods
         */
        var dh
        try {
            dh = defineHeader(json.headers);
        } catch (e) {
            console.log("require METADATA in json response")
            return 0;
        }

        let result = cloneObject(json)

        result.rows = result.rows.filter(row => row[dh.iDe] == de).filter(e => {
            return result.metaData.ouHierarchy[ou] == undefined ?
                result.metaData.ouHierarchy[e[dh.iOu]].includes(ou) :
                e[dh.iOu] == ou
        })

        let outputResult =
            //filter row match de,ou and with last pe exists data
            cloneObject(result.metaData.dimensions.ou).reduce((newRows, childOu) => {
                var row =
                    result.rows.filter(m => m[dh.iOu] == childOu).length != 0 ?
                    result.rows.filter(m => m[dh.iOu] == childOu).sort((a, b) => b[dh.iPe] - a[dh.iPe])[0] : {}
                newRows.push(row)
                return newRows
            }, [])
            //Sum de
            .reduce((sum, row) => {
                return sum += row[dh.iValue] != undefined ? defineValueWithTypeData(row[dh.iValue]) : 0, sum
            }, 0);
        if (isConvertToNumberWithThousand != undefined || isConvertToNumberWithThousand == false) {
            return outputResult
        } else {
            return numberWithThousands(outputResult)
        }
    }

    function cloneObject(object) {
        return JSON.parse(JSON.stringify(object));
    }


    var getLastesPeriodValue = function(json, de, ou, isConvertToNumberWithThousand) {
        /**
         * require dimension pe (exam: ..api/../dimension=dx:...&demension=pe:...)
         * return value of the last @param periods
         */
        var dh
        try {
            dh = defineHeader(json.headers);
        } catch (e) {
            console.log("require metadata in json response")
            return 0;
        }

        r = (null != ou) ?
            json.rows.filter(e => e[dh.iDe] == de && e[dh.iOu] == ou).sort((a, b) => b[dh.iPe] - a[dh.iPe]) :
            json.rows.filter(e => e[dh.iDe] == de).sort((a, b) => b[dh.iPe] - a[dh.iPe])
        if (isConvertToNumberWithThousand != undefined || isConvertToNumberWithThousand == false) {
            return r[0] == null ? 0 : defineValueWithTypeData(r[0][dh.iValue])
        } else {
            return r[0] == null ? 0 : numberWithThousands(defineValueWithTypeData(r[0][dh.iValue]))
        }
    }
    var dataTypesSupport = {
        NUMBER: {},
        CHECK_BOX: {},
        RADIO_BUTTON: {}
    }

    function defineValueWithTypeData(value, typeOfData) {
        if (typeOfData == null) {
            typeOfData = dataTypesSupport.NUMBER; //default is number;
        }

        switch (typeOfData) {
            case dataTypesSupport.NUMBER:
                if (value == null) {
                    return 0;
                } else {
                    return parseFloat(value);
                }
            case dataTypesSupport.CHECK_BOX:
                if (value == 1.0) {
                    return "x";
                } else {
                    return "";
                }
                break;
            case dataTypesSupport.RADIO_BUTTON:
                if (value == 1.0) {
                    return "x";
                } else {
                    return "";
                }
                break;
            default:
                break;
        }
    }

    function defineHeader(jsonHeaderDhis) {
        var result = {
            iDe: "",
            iOu: "",
            iPe: "",
            iValue: ""
        }
        for (var i = 0; i < jsonHeaderDhis.length; i++) {
            if (jsonHeaderDhis[i].name == "dx") result.iDe = i;
            else if (jsonHeaderDhis[i].name == "ou") result.iOu = i;
            else if (jsonHeaderDhis[i].name == "pe") result.iPe = i;
            else if (jsonHeaderDhis[i].name == "value") result.iValue = i;
        }
        return result;
    }

    function numberWithThousands(num) {
        var n = num.toString(),
            p = n.indexOf(',');
        return n.replace(/\d(?=(?:\d{3})+(?:\.|$))/g, function($0, i) {
            return p < 0 || i < p ? ($0 + '.') : $0;
        });
    }

    function getValueSum(json, de, ou, typeOfData) {
        var dh = defineHeader(json.headers),
            resultSum = 0;
        // typeOfData != null
        return (
            null != ou ?
            json.rows.filter(function(e) {
                return de instanceof Array ?
                    de.includes(e[dh.iDe]) && e[dh.iOu] == ou :
                    e[dh.iDe] == de && e[dh.iOu] == ou
            }) :
            json.rows.filter(function(e) {
                return de instanceof Array ?
                    de.includes(e[dh.iDe]) :
                    e[dh.iDe] == de
            })).forEach(function(e) {
            resultSum += parseFloat(defineValueWithTypeData(e[dh.iValue], typeOfData))
        }), numberWithThousands(resultSum);
    }

    return {
        getValueDE: getValueDE,
        defineValueWithTypeData: defineValueWithTypeData,
        numberWithThousands: numberWithThousands,
        defineHeader: defineHeader,
        getValueSum: getValueSum,
        getLastesPeriodValue: getLastesPeriodValue,
        getLastesPeriodValueByAncestor: getLastesPeriodValueByAncestor
    }
}

export default p2ild;
