import axios from "axios";
import { SessionCache, TransactionCache, FlowInDB } from "../types/session-types";
import { toast } from "react-toastify";

export const triggerSearch = async (
  session: TransactionCache,
  subUrl: string
) => {
  if (session.subscriberType === "BAP") {
    return;
  }
  console.log("session", session);
  const data = {
    subscriberUrl: subUrl,
    initiateSearch: true,
  };

  const response = await axios.post(
    `${import.meta.env.VITE_BACKEND_URL}/flow/trigger`,
    data
  );
  toast.info("search triggered");

  console.log("trigger response", response);
};

export const putCacheData = async (data: any, sessionId: string) => {
  return await axios.put(
    `${import.meta.env.VITE_BACKEND_URL}/sessions`,
    {
      ...data,
    },
    {
      params: {
        session_id: sessionId,
      },
    }
  );
};

export const triggerRequest = async (
  action: string,
  actionId: string,
  transaction_id: string,
  session_id: string,
  flowId: string,
  sessionData: SessionCache,
  subscriberUrl?: string,
  body?: any
) => {
  try {
    console.log("triggering request", action, actionId, transaction_id);
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/flow/trigger/${action}`,
      body,
      {
        params: {
          action_id: actionId,
          transaction_id: transaction_id,
          subscriber_url: subscriberUrl,
          version: sessionData.version,
          session_id: session_id,
          flow_id: flowId,
        },
      }
    );
    toast.info(`${action} triggered`);
    return response;
  } catch (e) {
    // toast.error(`Error triggering ${action}`);
    console.log(e);
  }
};

export const clearFlowData = async (sessionId: string, flowId: string) => {
  try {
    console.log("clearing flow", sessionId, flowId);
    await axios.delete(
      `${import.meta.env.VITE_BACKEND_URL}/sessions/clearFlow`,
      {
        params: {
          session_id: sessionId,
          flow_id: flowId,
        },
      }
    );
    toast.info("Flow cleared");
  } catch (e) {
    toast.error("Error clearing flow");
    console.log(e);
  }
};

export const getCompletePayload = async (payload_ids: string[]) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/db/payload`,
      {
        payload_ids: payload_ids,
      }
    );

    return response.data;
  } catch (e: any) {
    console.log("error while fetching complete paylaod: ", e);
    throw new Error(e);
  }
};

export const getTransactionData = async (
  transaction_id: string,
  subscriber_url: string
) => {
  const url = `${import.meta.env.VITE_BACKEND_URL}/sessions/transaction`;
  try {
    const response = await axios.get(url, {
      params: {
        transaction_id,
        subscriber_url,
      },
    });
    console.log("transaction data", response.data);
    return response.data as TransactionCache;
  } catch (e) {
    toast.error("Error while fetching transaction data");
    console.error("error while fetching transaction data", e);
  }
};

export const addExpectation = async (
  action: string,
  flowId: string,
  subscriberUrl: string,
  sessionId: string
) => {
  try {
    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/sessions/expectation`,
      {},
      {
        params: {
          expected_action: action,
          flow_id: flowId,
          subscriber_url: subscriberUrl,
          session_id: sessionId,
        },
      }
    );
    // toast.info("Expectation added");
  } catch (e: any) {
    console.log(e);
    toast.error(e?.message ?? "Error adding expectation");
  }
};

export const deleteExpectation = async (
  session_id: string,
  subscriber_url: string
) => {
  try {
    await axios.delete(
      `${import.meta.env.VITE_BACKEND_URL}/sessions/expectation`,
      {
        params: {
          session_id,
          subscriber_url,
        },
      }
    );
  } catch (e: any) {
    console.log(e);
  }
};

export const requestForFlowPermission = async (
  action: string,
  subscriberUrl: string
) => {
  try {
    const data: {
      data: { valid: boolean; message: string };
    } = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/sessions/flowPermission`,
      {
        params: {
          action,
          subscriber_url: subscriberUrl,
        },
      }
    );
    console.log("flow permission data", data);
    if (!data.data.valid) {
      toast.error(data.data.message);
    }
    return data.data.valid;
  } catch (e: any) {
    console.error(e);
  }
};

export const getLogs = async (sessionId: string) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/logs`,
      {
        params: {
          sessionId: sessionId,
        },
      }
    );

    return response.data;
  } catch (e) {
    console.error("Something went wrong while fetching logs: ", e);
  }
};

export const fetchFormFieldData = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/config/senarioFormData`
    );

    console.log("form field data", response.data);
    return response.data;
  } catch (e) {
    console.log("error while fetching form field data", e);
  }
};

export const getMappedFlow = async (
  transactionId: string,
  sessionId: string
) => {
  const url = `${import.meta.env.VITE_BACKEND_URL}/flow/current-state`;
  try {
    const response = await axios.get(url, {
      params: {
        transaction_id: transactionId,
        session_id: sessionId,
      },
    });
    console.log("mapped flow data", response.data);
    return response.data;
  } catch (e) {
    toast.error("Error while fetching mapped flow data");
    throw new Error("Error while fetching mapped flow data");
  }
};

export const proceedFlow = async (
  sessionId: string,
  transactionId: string,
  jsonPathChanges?: Record<string, any>,
  inputs?: any
) => {
  try {
    console.log('🚀 [proceedFlow] Sending request:', {
      url: `${import.meta.env.VITE_BACKEND_URL}/flow/proceed`,
      sessionId,
      transactionId,
      jsonPathChanges,
      inputs
    });
    
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/flow/proceed`,
      {
        session_id: sessionId,
        transaction_id: transactionId,
        json_path_changes: jsonPathChanges,
        inputs: inputs,
      }
    );
    
    console.log('✅ [proceedFlow] Response received:', response.data);
    return response.data;
  } catch (e: any) {
    console.error("❌ [proceedFlow] Error:", {
      message: e.message,
      response: e.response?.data,
      status: e.response?.status
    });
    throw new Error("Error while proceeding flow");
  }
};

export const newFlow = async (
  sessionId: string,
  flowId: string,
  transactionId: string,
  json_path_changes?: Record<string, any>,
  inputs?: any
) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/flow/new`,
      {
        session_id: sessionId,
        flow_id: flowId,
        transaction_id: transactionId,
        json_path_changes: json_path_changes,
        inputs: inputs,
      }
    );
    return response.data;
  } catch (e) {
    toast.error("Error while starting new flow");
    console.error("Error while creating new flow", e);
  }
};

export const getReportingStatus = async (domain: string, version: string) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/config/reportingStatus`,
      {
        params: {
          domain,
          version,
        },
      }
    );

    return response.data.data;
  } catch (e) {
    console.log("error while fetching repoting", e);
  }
};

export async function htmlFormSubmit(link: string, data: any) {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/flow/external-form`,
      {
        link: link,
        data: data,
      }
    );
    return res;
  } catch (error) {
    throw new Error("ERROR");
  }
}
export const updateCustomFlow = async (sessionId: string, flow: any) => {
  try {
    const data = {
      session_id: sessionId,
      flows: [flow],
    };

    await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/flow/custom-flow`,
      data
    );
  } catch (e) {
    console.log("error setting custom flow", e);
  }
};

export const getActions = async (domain: string, version: string) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/flow/actions`,
      {
        domain: domain,
        version: version,
      }
    );
    
    return res.data;
  } catch (error) {
    console.error("errror while getting action: ", error)
    throw new Error("ERROR while getting action");
  }
};

export const getReport = async (sessionId: string) => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/db/report`,
      {
        params: {
          session_id: sessionId,
        },
      }
    );
    
    return res.data;
  } catch (error) {
    console.error("errror while getting action: ", error)
    throw new Error("ERROR while getting action");
  }
}

export const getSessions = async (subId: string, npType: string) => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/db/sessions`,
      {
        params: {
          sub_id: subId,
          np_type: npType
        },
      }
    );
    
    return res.data;
  } catch (error) {
    console.error("errror while getting sessions from db: ", error)
    throw new Error("ERROR while getting sessions from db");
  }
}

export const addFlowToSessionInDB = async (sessionId: string, flow: FlowInDB) => {
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_BACKEND_URL}/api/sessions/flows/${sessionId}`,
      flow,
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_DB_SERVICE_API_KEY,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error("Error while adding flow to session:", error);
    throw new Error("ERROR while adding flow to session");
  }
};

export const updateFlowInSession = async (sessionId: string, flow: FlowInDB) => {
  try {
    const res = await axios.put(
      `${import.meta.env.VITE_BACKEND_URL}/api/sessions/flows/${sessionId}`,
      { flow },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_DB_SERVICE_API_KEY,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.error("Error while updating flow in session:", error);
    throw new Error("ERROR while updating flow in session");
  }
};
