// Egress-proxy setup — fork addition (Mrfentmen/printify-mcp, 2026-10-21).
//
// In sandboxed environments whose egress goes through an HTTP proxy named by
// the standard https_proxy/HTTPS_PROXY env vars, axios (used by
// printify-sdk-js) cannot reach the API on its own: its built-in env-proxy
// handling passes the target host in a Host header while dialing the proxy
// authority, which Node >= 20 rejects (ERR_INVALID_ARG_VALUE). This module
// disables axios's built-in proxy handling and installs an HttpsProxyAgent
// (proper CONNECT tunneling) on the default axios instance instead. When no
// proxy env var is set it does nothing, so behavior elsewhere is unchanged.
// TLS still terminates end-to-end through the tunnel; NODE_EXTRA_CA_CERTS is
// honored by Node as usual.
import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

const proxyUrl =
  process.env.https_proxy ||
  process.env.HTTPS_PROXY ||
  process.env.http_proxy ||
  process.env.HTTP_PROXY;

if (proxyUrl) {
  try {
    const agent = new HttpsProxyAgent(proxyUrl);
    axios.defaults.httpsAgent = agent;
    axios.defaults.httpAgent = agent;
    axios.defaults.proxy = false;
  } catch (err) {
    console.error("proxy-setup: failed to install proxy agent:", err);
  }
}

export {};
