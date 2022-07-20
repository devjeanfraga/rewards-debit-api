import axios from 'axios';
export default new class RewardsDebitController {

    async store(req, res) { //post debitar o número de pontos
        let { OrderId, State, hookConfig, debitValue, clientId, debitOrder } = req.body; // captura as variaveis número do pedido, estado do pedido e configuração
        if (hookConfig) {
          return res.status(200).json({ "Config": "Successful" })
        } //se possuir a variavel configuração, significa que o request foi somente de configuração
          //retorna um status 200 para informar que a configuração foi bem sucedida
        if ((!State) && (!(debitValue && clientId && debitOrder))) //verifica se a váriavel estado foi passada no body da requisição
            return res.status(400).json({ "error": "Bad Request" }); //envia um erro informando requisição inválida
        else if (State) { //verifica se possui estado
            if (State === "canceled") { //verifica se o estado do pedido é de cancelado
                let orderResponse = await axios.get(`https://${process.env.ACCOUNT_NAME}.${process.env.ENVIROMENT}.com/api/oms/pvt/orders/${OrderId}`,
                    { headers: { "X-VTEX-API-AppKey": process.env.X_VTEX_API_AppKey, "X-VTEX-API-AppToken": process.env.X_VTEX_API_AppToken } }); //getOrderById captura informação do pedido pelo número do pedido

                let id_client = await orderResponse.data.clientProfileData.userProfileId; //captura o número do cliente pelo pedido
                let orderValue = await orderResponse.data.value; // valor total do pedido
                //let totalOrderItemsValue = await orderResponse.data.totals[0].value; //valor total dos itens do pedido
                let orderValueWithoutShip = orderValue + (await orderResponse.data.totals[2].value); //valor total dos pontos (deduzindo o frete)
                let points = ((orderValueWithoutShip / 100) + "").split(".")[0]; //Logica para eliminar os centavos

                //get no documento do masterdata
                let masterDataDocumentResponse =
                    await axios.get(`https://${process.env.ACCOUNT_NAME}.${process.env.ENVIROMENT}.com/api/dataentities/${process.env.DATA_ENTITY_NAME}/documents/${process.env.MASTERDATA_DOCUMENT_ID}?_fields=${id_client}`,
                        { headers: { "X-VTEX-API-AppKey": process.env.X_VTEX_API_AppKey, "X-VTEX-API-AppToken": process.env.X_VTEX_API_AppToken } });

                if (!masterDataDocumentResponse.data[id_client]) { // se o usuário não tiver histórico de compra
                    res.status(404).json({ "error": "User not found" });
                } else { //se o histórico for encontrado
                    if (masterDataDocumentResponse.data[id_client].orders[OrderId]) { //verifica se o pedido se encontra no histórico do usuario
                        let responseUpdate = await axios.patch(`https://${process.env.ACCOUNT_NAME}.${process.env.ENVIROMENT}.com/api/dataentities/${process.env.DATA_ENTITY_NAME}/documents/${process.env.MASTERDATA_DOCUMENT_ID}`,
                            {
                                [id_client]: {
                                    ...masterDataDocumentResponse.data[id_client],
                                    "points": +masterDataDocumentResponse.data[id_client].points - +points,
                                    "orders": {
                                        ...masterDataDocumentResponse.data[id_client].orders,
                                        [OrderId]: {
                                            "orderItemsValue": orderValueWithoutShip,
                                            "operation": "debit"
                                        }
                                    }
                                }
                            },
                            {
                                headers: { "X-VTEX-API-AppKey": process.env.X_VTEX_API_AppKey, "X-VTEX-API-AppToken": process.env.X_VTEX_API_AppToken }
                            });
                        res.status(responseUpdate.status).json({ "Response": "Ok - User's Orders Updated" });
                    } else { // se o pedido não estiver no histórico do usuário
                        res.status(400).json({ "error": "The Order don't exists for this user" });
                    }
                }
            } else { //se o estado for diferente de canceled
                return res.status(100).json({ "Info": "Only canceled Orders change the user's points in this API." });
            }
        } else { //se não possuir estado, vai para a segunda forma de debito informando o valor a ser debitado
            let masterDataDocumentResponse =
                await axios.get(`https://${process.env.ACCOUNT_NAME}.${process.env.ENVIROMENT}.com/api/dataentities/${process.env.DATA_ENTITY_NAME}/documents/${process.env.MASTERDATA_DOCUMENT_ID}?_fields=${clientId}`,
                    { headers: { "X-VTEX-API-AppKey": process.env.X_VTEX_API_AppKey, "X-VTEX-API-AppToken": process.env.X_VTEX_API_AppToken } });

            if (!masterDataDocumentResponse.data[clientId]) { // se o usuário não tiver pontos
                res.status(400).json({ "error": "User not found" });
            } else { //se o histórico for encontrado
                if (!masterDataDocumentResponse.data[clientId].orders[debitOrder]) { // se a ordem de debito não tiver sido utilizada
                    let newPoints = +masterDataDocumentResponse.data[clientId].points - +debitValue;
                    let responseUpdate = await axios.patch(`https://${process.env.ACCOUNT_NAME}.${process.env.ENVIROMENT}.com/api/dataentities/${process.env.DATA_ENTITY_NAME}/documents/${process.env.MASTERDATA_DOCUMENT_ID}`,
                        {
                            [clientId]: {
                                ...masterDataDocumentResponse.data[clientId],
                                "points": newPoints,
                                "orders": {
                                    ...masterDataDocumentResponse.data[clientId].orders,
                                    [debitOrder]: {
                                        "debitValueInPoints": +debitValue,
                                        "operation": "debit"
                                    }
                                }
                            }
                        },
                        {
                            headers: { "X-VTEX-API-AppKey": process.env.X_VTEX_API_AppKey, "X-VTEX-API-AppToken": process.env.X_VTEX_API_AppToken }
                        });
                    res.status(201).json({ "Points": newPoints });
                }else{
                    res.status(400).json({ "Error": "The debit Order must be unique" });
                }
            }

        }
    }
}