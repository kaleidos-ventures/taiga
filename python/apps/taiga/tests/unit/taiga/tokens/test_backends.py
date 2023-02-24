# -*- coding: utf-8 -*-
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# Copyright (c) 2023-present Kaleidos INC
#
# The code is partially taken (and modified) from djangorestframework-simplejwt v. 4.7.1
# (https://github.com/jazzband/djangorestframework-simplejwt/tree/5997c1aee8ad5182833d6b6759e44ff0a704edb4)
# that is licensed under the following terms:
#
#   Copyright 2017 David Sanders
#
#   Permission is hereby granted, free of charge, to any person obtaining a copy of
#   this software and associated documentation files (the "Software"), to deal in
#   the Software without restriction, including without limitation the rights to
#   use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
#   of the Software, and to permit persons to whom the Software is furnished to do
#   so, subject to the following conditions:
#
#   The above copyright notice and this permission notice shall be included in all
#   copies or substantial portions of the Software.
#
#   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
#   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
#   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
#   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
#   SOFTWARE.

from datetime import datetime, timedelta
from typing import Any
from unittest.mock import patch

import jwt
import pytest
from jwt import PyJWS, algorithms
from taiga.base.utils.datetime import datetime_to_epoch
from taiga.tokens.backends import TokenBackend
from taiga.tokens.exceptions import ExpiredTokenBackendError, TokenBackendError

SECRET = "not_secret"

PRIVATE_KEY = """
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA3xMJfyl8TOdrsjDLSIodsArJ/NnQB3ZdfbFC5onxATDfRLLA
CHFo3ye694doBKeSe1NFYbfXPvahl6ODX1a23oQyoRQwlL+M99cLcdCa0gGuJXdb
AaF6Em8E+7uSb3290mI+rZmjqyc7gMtKVWKL4e5i2PerFFBoYkZ7E90KOp2t0ZAD
x2uqF4VTOfYLHG0cPgSw9/ptDStJqJVAOiRRqbv0j0GOFMDYNcN0mDlnpryhQFbQ
iMqn4IJIURZUVBJujFSa45cJPvSmMb6NrzZ1crg5UN6/5Mu2mxQzAi21+vpgGL+E
EuekUd7sRgEAjTHjLKzotLAGo7EGa8sL1vMSFwIDAQABAoIBAQCGGWabF/BONswq
CWUazVR9cG7uXm3NHp2jIr1p40CLC7scDCyeprZ5d+PQS4j/S1Ema++Ih8CQbCjG
BJjD5lf2OhhJdt6hfOkcUBzkJZf8aOAsS6zctRqyHCUtwxuLhFZpM4AkUfjuuZ3u
lcawv5YBkpG/hltE0fV+Jop0bWtpwiKxVsHXVcS0WEPXic0lsOTBCw8m81JXqjir
PCBOnkxgNpHSt69S1xnW3l9fPUWVlduO3EIZ5PZG2BxU081eZW31yIlKsDJhfgm6
R5Vlr5DynqeojAd6SNliCzNXZP28GOpQBrYIeVQWA1yMANvkvd4apz9GmDrjF/Fd
g8Chah+5AoGBAPc/+zyuDZKVHK7MxwLPlchCm5Zb4eou4ycbwEB+P3gDS7MODGu4
qvx7cstTZMuMavNRcJsfoiMMrke9JrqGe4rFGiKRFLVBY2Xwr+95pKNC11EWI1lF
5qDAmreDsj2alVJT5yZ9hsAWTsk2i+xj+/XHWYVkr67pRvOPRAmGMB+NAoGBAOb4
CBHe184Hn6Ie+gSD4OjewyUVmr3JDJ41s8cjb1kBvDJ/wv9Rvo9yz2imMr2F0YGc
ytHraM77v8KOJuJWpvGjEg8I0a/rSttxWQ+J0oYJSIPn+eDpAijNWfOp1aKRNALT
pboCXcnSn+djJFKkNJ2hR7R/vrrM6Jyly1jcVS0zAoGAQpdt4Cr0pt0YS5AFraEh
Mz2VUArRLtSQA3F69yPJjlY85i3LdJvZGYVaJp8AT74y8/OkQ3NipNP+gH3WV3hu
/7IUVukCTcsdrVAE4pe9mucevM0cmie0dOlLAlArCmJ/Axxr7jbyuvuHHrRdPT60
lr6pQr8afh6AKIsWhQYqIeUCgYA+v9IJcN52hhGzjPDl+yJGggbIc3cn6pA4B2UB
TDo7F0KXAajrjrzT4iBBUS3l2Y5SxVNA9tDxsumlJNOhmGMgsOn+FapKPgWHWuMU
WqBMdAc0dvinRwakKS4wCcsVsJdN0UxsHap3Y3a3+XJr1VrKHIALpM0fmP31WQHG
8Y1eiwKBgF6AYXxo0FzZacAommZrAYoxFZT1u4/rE/uvJ2K9HYRxLOVKZe+89ki3
D7AOmrxe/CAc/D+nNrtUIv3RFGfadfSBWzyLw36ekW76xPdJgqJsSz5XJ/FgzDW+
WNC5oOtiPOMCymP75oKOjuZJZ2SPLRmiuO/qvI5uAzBHxRC1BKdt
-----END RSA PRIVATE KEY-----
"""

PUBLIC_KEY = """
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3xMJfyl8TOdrsjDLSIod
sArJ/NnQB3ZdfbFC5onxATDfRLLACHFo3ye694doBKeSe1NFYbfXPvahl6ODX1a2
3oQyoRQwlL+M99cLcdCa0gGuJXdbAaF6Em8E+7uSb3290mI+rZmjqyc7gMtKVWKL
4e5i2PerFFBoYkZ7E90KOp2t0ZADx2uqF4VTOfYLHG0cPgSw9/ptDStJqJVAOiRR
qbv0j0GOFMDYNcN0mDlnpryhQFbQiMqn4IJIURZUVBJujFSa45cJPvSmMb6NrzZ1
crg5UN6/5Mu2mxQzAi21+vpgGL+EEuekUd7sRgEAjTHjLKzotLAGo7EGa8sL1vMS
FwIDAQAB
-----END PUBLIC KEY-----
"""

AUDIENCE = "openid-client-id"

ISSUER = "https://www.myoidcprovider.com"


hmac_token_backend = TokenBackend("HS256", SECRET)
rsa_token_backend = TokenBackend("RS256", PRIVATE_KEY, PUBLIC_KEY)
aud_iss_token_backend = TokenBackend("RS256", PRIVATE_KEY, PUBLIC_KEY, AUDIENCE, ISSUER)
payload: dict[str, Any] = {"foo": "bar"}


def test_init() -> None:
    # Should reject unknown algorithms
    with pytest.raises(TokenBackendError):
        TokenBackend("oienarst oieanrsto i", "not_secret")

    TokenBackend("HS256", "not_secret")


@patch.object(algorithms, "has_crypto", new=False)
def test_init_fails_for_rs_algorithms_when_crypto_not_installed() -> None:
    with pytest.raises(TokenBackendError, match=r"You must have cryptography installed to use 'RS256'."):
        TokenBackend("RS256", "not_secret")
    with pytest.raises(TokenBackendError, match=r"You must have cryptography installed to use 'RS384'."):
        TokenBackend("RS384", "not_secret")
    with pytest.raises(TokenBackendError, match=r"You must have cryptography installed to use 'RS512'."):
        TokenBackend("RS512", "not_secret")


def test_encode_hmac() -> None:
    # Should return a JSON web token for the given payload
    payload = {"exp": datetime(year=2000, month=1, day=1)}

    hmac_token = hmac_token_backend.encode(payload)

    # Token could be one of two depending on header dict ordering
    assert hmac_token in (
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJleHAiOjk0NjY4NDgwMH0.NHpdD2X8ub4SE_MZLBedWa57FCpntGaN_r6f8kNKdUs",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk0NjY4NDgwMH0.jvxQgXCSDToR8uKoRJcMT-LmMJJn2-NM76nfSR2FOgs",
    )


def test_encode_rsa() -> None:
    # Should return a JSON web token for the given payload
    payload = {"exp": datetime(year=2000, month=1, day=1)}

    rsa_token = rsa_token_backend.encode(payload)

    # Token could be one of two depending on header dict ordering
    assert rsa_token in (
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJleHAiOjk0NjY4NDgwMH0.cuE6ocmdxVHXVrGufzn-_"
        "ZbXDV475TPPb5jtSacvJsnR3s3tLIm9yR7MF4vGcCAUGJn2hU_JgSOhs9sxntPPVjdwvC3-sxAwfUQ5AgU"
        "CEAF5XC7wTvGhmvufzhAgEG_DNsactCh79P8xRnc0iugtlGNyFp_YK582-ZrlfQEp-7C0L9BNG_JCS2J9D"
        "sGR7ojO2xGFkFfzezKRkrVTJMPLwpl0JAiZ0iqbQE-Tex7redCrGI388_mgh52GLsNlSIvW2gQMqCVMYnd"
        "MuYx32Pd5tuToZmLUQ2PJ9RyAZ4fOMApTzoshItg4lGqtnt9CDYzypHULJZohJIPcxFVZZfHxhw",
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk0NjY4NDgwMH0.pzHTOaVvKJMMkSqksGh-N"
        "deEvQy8Thre3hBM3smUW5Sohtg77KnHpaUYjq30DyRmYQRmPSjEVprh1Yvic_-OeAXPW8WVsF-r4YdJuxW"
        "UpuZbIPwJ9E-cMfTZkDkOl18z1zOdlsLtsP2kXyAlptyy9QQsM7AxoqM6cyXoQ5TI0geWccgoahTy3cBtA"
        "6pmjm7H0nfeDGqpqYQBhtaFmRuIWn-_XtdN9C6NVmRCcZwyjH-rP3oEm6wtuKJEN25sVWlZm8YRQ-rj7A7"
        "SNqBB5tFK2anM_iv4rmBlIEkmr_f2s_WqMxn2EWUSNeqbqiwabR6CZUyJtKx1cPG0B2PqOTcZsg",
    )


def test_encode_aud_iss() -> None:
    # Should return a JSON web token for the given payload
    original_payload = {"exp": datetime(year=2000, month=1, day=1)}
    payload = original_payload.copy()

    rsa_token = aud_iss_token_backend.encode(payload)

    # Assert that payload has not been mutated by the encode() function
    assert payload == original_payload

    # Token could be one of 12 depending on header dict ordering
    assert rsa_token in (
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJleHAiOjk0NjY4NDgwMCwiYXVkIjoib3BlbmlkLWNsa"
        "WVudC1pZCIsImlzcyI6Imh0dHBzOi8vd3d3Lm15b2lkY3Byb3ZpZGVyLmNvbSJ9.kSz7KyUZgpKaeQHYSQ"
        "lhsE-UFLG2zhBiJ2MFCIvhstA4lSIKj3U1fdP1OhEDg7X66EquRRIZrby6M7RncqCdsjRwKrEIaL74KgC4"
        "s5PDXa_HC6dtpi2GhXqaLz8YxfCPaNGZ_9q9rs4Z4O6WpwBLNmMQrTxNno9p0uT93Z2yKj5hGih8a9C_CS"
        "f_rKtsHW9AJShWGoKpR6qQFKVNP1GAwQOQ6IeEvZenq_LSEywnrfiWp4Y5UF7xi42wWx7_YPQtM9_Bp5sB"
        "-DbrKg_8t0zSc-OHeVDgH0TKqygGEea09W0QkmJcROkaEbxt2LxJg9OuSdXgudVytV8ewpgNtWNE4g",
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJleHAiOjk0NjY4NDgwMCwiaXNzIjoiaHR0cHM6Ly93d"
        "3cubXlvaWRjcHJvdmlkZXIuY29tIiwiYXVkIjoib3BlbmlkLWNsaWVudC1pZCJ9.l-sJR5VKGKNrEn5W8s"
        "fO4tEpPq4oQ-Fm5ttQyqUkF6FRJHmCfS1TZIUSXieDLHmarnb4hdIGLr5y-EAbykiqYaTn8d25oT2_zIPl"
        "CYHt0DxxeuOliGad5l3AXbWee0qPoZL7YCV8FaSdv2EjtMDOEiJBG5yTkaqZlRmSkbfqu1_y2DRErv3X5L"
        "pfEHuKoum4jv5YpoCS6wAWDaWJ9cXMPQaGc4gXg4cuSQxb_EjiQ3QYyztHhG37gOu1J-r_rudaiiIk_VZQ"
        "dYNfCcirp8isS0z2dcNij_0bELp_oOaipsF7uwzc6WfNGR7xP50X1a_K6EBZzVs0eXFxvl9b3C_d8A",
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJvcGVuaWQtY2xpZW50LWlkIiwiZXhwIjo5N"
        "DY2ODQ4MDAsImlzcyI6Imh0dHBzOi8vd3d3Lm15b2lkY3Byb3ZpZGVyLmNvbSJ9.aTwQEIxSzhI5fN4ffQ"
        "MzZ6h61Ur-Gzh_gPkgOyyWvMX890Z18tC2RisEjXeL5xDGKe2XiEAVtuJa9CjXB9eJoCxNN1k05C-ph82c"
        "co-0m_TbMbs0d1MFnfC9ESr4JKynP_Klxi8bi0iZMazduT15pH4UhRkEGsnp8rOKtlt_8_8UOGBJAzG341"
        "61lM4JbZqrZDit1DvQdGxaC0lmMgosKg3NDMECfkPe3pGLJ5F_su5yhQk0xyKNCjYyE2FNlilWoDV2KkGi"
        "CWdsFOgRMAJwHZ-cdgPg8Vyh2WthBNblsbRVfDrGtfPX0VuW5B0RhBhvI5Iut34P9kkxKRFo3NaiEg",
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJvcGVuaWQtY2xpZW50LWlkIiwiaXNzIjoia"
        "HR0cHM6Ly93d3cubXlvaWRjcHJvdmlkZXIuY29tIiwiZXhwIjo5NDY2ODQ4MDB9.w46s7u28LgsnmK6K_5"
        "O15q1SFkKeRgkkplFLi5idq1z7qJjXUi45qpXIyQw3W8a0k1fwa22WB_0XC1MTo22OK3Z0aGNCI2ZCBxvZ"
        "GOAc1WcCUae44a9LckPHp80q0Hs03NvjsuRVLGXRwDVHrYxuGnFxQSEMbZ650-MQkfVFIXVzMOOAn5Yl4n"
        "tjigLcw8iPEqJPnDLdFUSnObZjRzK1M6mJf0-125pqcFsCJaa49rjdbTtnN-VuGnKmv9wV1GwevRQPWjx2"
        "vinETURVO9IyZCDtdaLJkvL7Z5IpToK5jrZPc1UWAR0VR8WeWfussFoHzJF86LxVxnqIeXnqOhq5SQ",
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL3d3dy5teW9pZGNwcm92aWRlc"
        "i5jb20iLCJhdWQiOiJvcGVuaWQtY2xpZW50LWlkIiwiZXhwIjo5NDY2ODQ4MDB9.Np_SJYye14vz0cvALv"
        "fYNqZXvXMD_gY6kIaxA458kbeu6veC_Ds45uWgjJFhTSYFAFWd3TB6M7qZbWgiO0ycION2-B9Yfgaf82Wz"
        "NtPfgDhu51w1cbLnvuOSRvgX69Q6Z2i1SByewKaSDw25BaMv9Ty4DBdoCbG62qELnNKjDSQvuHlz8cRJv2"
        "I6xJBeOYgZV-YN8Zmxsles44a57Vvcj-DjVouHj5m4LperIxb9islNUQBPRTbvw1d_tR8O8ny0mQqbsWL7"
        "e2J-wfwdduVf1kVCPePkhHMM6GLhPIrSoTgMzZuRYLBJ61yphuDK98zTknNBM-Jtn5cMyBwP9JBJvA",
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJodHRwczovL3d3dy5teW9pZGNwcm92aWRlc"
        "i5jb20iLCJleHAiOjk0NjY4NDgwMCwiYXVkIjoib3BlbmlkLWNsaWVudC1pZCJ9.KJcWZtEluPrkRbYj2i"
        "_QmdWpZqGZt63Q8nO4QAJ4B4418ZfmgB6A54_vUmWd3Xc18DYgReLoNPlaOuRXtR7rzlMk0-ADjV0bsca5"
        "NwTNAV2F-gR9Xsr9iFlcPMNAYf4CAs85gg7deMIxlbGTAaoft__58ah2_vdd8o_nem1PdzsPC198AYtcwn"
        "IV206qpeCNR8S_ZTU46OaHwCoySVRx9E7tNG13YSCmGvBaEqgQHKH82qLXo0KivFrjGmGP0xePFG1B8HCZ"
        "l-LH1euXGGCp6S48q-tmepX5GJwvzaZNBam4pfxQ0GIHa7z11e7sEN-196iDPCK8NzDcXFwHOAnyaA",
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk0NjY4NDgwMCwiYXVkIjoib3BlbmlkLWNsa"
        "WVudC1pZCIsImlzcyI6Imh0dHBzOi8vd3d3Lm15b2lkY3Byb3ZpZGVyLmNvbSJ9.MfhVcFN-9Rd0j11CLt"
        "xopzREKdyJH1loSpD4ibjP6Aco4-iM5C99B6gliPgOldtuevhneXV2I7NGhmZFULaYhulcLrAgKe3Gj_TK"
        "-sHvwb62e14ArugmK_FAhN7UqbX8hU9wP42LaWXqA7ps4kkJSx-sfgHqMzCKewlAZWwyZBoFgWEgoheKZ7"
        "ILkSGf0jzBZlS_1R0jFRSrlYD9rI1S4Px-HllS0t32wRCSbzkp6aVMRs46S0ePrN1mK3spsuQXtYhE2913"
        "ZC7p2KwyTGfC2FOOeJdRJknh6kI3Z7pTcsjN2jnQN3o8vPEkN3wl7MbAgAsHcUV45pvyxn4SNBmTMQ",
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk0NjY4NDgwMCwiaXNzIjoiaHR0cHM6Ly93d"
        "3cubXlvaWRjcHJvdmlkZXIuY29tIiwiYXVkIjoib3BlbmlkLWNsaWVudC1pZCJ9.3NjgS14SGFyJ6cix2X"
        "JZFPlcyeSu4LSduEMUIH0grJuCljbhalyoib5s4JnBaK4slKrQv1WHlhnKB737hX1FF7_EwQM3toCf--DB"
        "jrIuq5cYK3rzcn71JDe_op3CvClwpVyxd2vQZtQfP_tWqN6cNTuWF8ZQ0rJGug6Zb-NeE5h68YK_9tXLZC"
        "_i5anyjjAVONOc3Nd-TeIUBaLQKQXOddw0gcTcA7vg3uS0gXTEDq-_ZkF-v9bn1ua4_lgRPbuaYvrBFbXS"
        "CEdvNORPfPz4zfL3XU09q0gmnmXC9nxjUFVX4BjkP_YiCCO42sqUKY4y7STTB_IkK_04e2wntonVZA",
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3d3dy5teW9pZGNwcm92aWRlc"
        "i5jb20iLCJleHAiOjk0NjY4NDgwMCwiYXVkIjoib3BlbmlkLWNsaWVudC1pZCJ9.b4pdohov81oqzLyCIp"
        "4y7e4VYz7LSez7bH0t1o0Zwzau1uXPYXcasT9lxxNMEEiZwHIovPLyWQ6XvF0bMWTk9vc4PyIpkLqsLBJP"
        "suQ-wYUOD04fECmqUX_JaINqm2pPbohTcOQwl0xsE1UMIKTFBZDL1hEXGEMdW9lrPcXilhbC1ikyMpzsmV"
        "h55Q_wL2GqydssnOOcDQTqEkWoKvELJJhBcE-YuQkUp8jEVhF3VZ4jEZkzCErTlyXcfe1qXZHkWtw2QNo9"
        "s_SfLuRy_fACOo8XE9pHBoE7rqiSm-FmISgiLO1Jj3Pqq-abjN4SnAbU7PZWcV3fUoO1eYLGORmAcw",
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3d3dy5teW9pZGNwcm92aWRlc"
        "i5jb20iLCJhdWQiOiJvcGVuaWQtY2xpZW50LWlkIiwiZXhwIjo5NDY2ODQ4MDB9.yDGMBeee4hj8yDtEvV"
        "tIsS4tnkPjDMQADTkNh74wtb3oYPgQNqMRWKngXiwjvW2FmnsCUue2cFzLgTbpqlDq0QKcBP0i_UwBiXk9"
        "m2wLo0WRFtgw2zNHYSsowu26sFoEjKLgpPZzKrPlU4pnxqa8u3yqg8vIcSTlpX8t3uDqNqhUKP6x-w6wb2"
        "5h67XDmnORiMwhaOZE_Gs9-H6uWnKdguTIlU1Tj4CjUEnZgZN7dJORiDnO_vHiAyL5yvRjhp5YK0Pq-TtC"
        "j5kWoJsjQiKc4laIcgofAKoq_b62Psns8MhxzAxwM7i0rbQZXXYB0VKMUho88uHlpbSWCZxu415lWw",
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJvcGVuaWQtY2xpZW50LWlkIiwiaXNzIjoia"
        "HR0cHM6Ly93d3cubXlvaWRjcHJvdmlkZXIuY29tIiwiZXhwIjo5NDY2ODQ4MDB9.BHSCjFeXS6B7KFJi1L"
        "pQMEd3ib4Bp9FY3WcB-v7dtP3Ay0SxQZz_gxIbi-tYiNCBQIlfKcfq6vELOjE1WJ5zxPDQM8uV0Pjl41hq"
        "YBu3qFv4649a-o2Cd-MaSPUSUogPxzTh2Bk4IdM3sG1Zbd_At4DR_DQwWJDuChA8duA5yG2XPkZr0YF1ZJ"
        "326O_jEowvCJiZpzOpH9QsLVPbiX49jtWTwqQGhvpKEj3ztTLFo8VHO-p8bhOGEph2F73F6-GB0XqiWk2D"
        "m1yKAunJCMsM4qXooWfaX6gj-WFhPI9kEXNFfGmPal5i1gb17YoeinbdV2kjN42oxast2Iaa3CMldw",
        "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJvcGVuaWQtY2xpZW50LWlkIiwiZXhwIjo5N"
        "DY2ODQ4MDAsImlzcyI6Imh0dHBzOi8vd3d3Lm15b2lkY3Byb3ZpZGVyLmNvbSJ9.s6sElpfKL8WHWfbD_K"
        "bwiy_ip4O082V8ElZqwugvDpS-7yQ3FTvQ3WXqtVAJc-fBZe4ZsBnrXUWwZV0Nhoe6iWKjEjTPjonQWbWL"
        "_WUJmIC2HVz18AOISnqReV2rcuLSHQ2ckhsyktlE9K1Rfj-Hi6f3HzzzePEgTsL2ZdBH6GrcmJVDFKqLLr"
        "kvOHShoPp7rcwuFBr0J_S1oqYac5O0B-u0OVnxBXTwij0ThrTGMgVCp2rn6Hk0NvtF6CE49Eu4XP8Ue-AP"
        "T8l5_SjqX9GcrjkJp8Gif_oyBheL-zRg_v-cU60X6qY9wVolO8WodVPSnlE02XyYhLVxvfK-w5129A",
    )


def test_decode_hmac_with_no_expiry() -> None:
    no_exp_token = jwt.encode(payload, SECRET, algorithm="HS256")

    hmac_token_backend.decode(no_exp_token)


def test_decode_hmac_with_no_expiry_no_verify() -> None:
    no_exp_token = jwt.encode(payload, SECRET, algorithm="HS256")

    assert hmac_token_backend.decode(no_exp_token, verify=False) == payload


def test_decode_hmac_with_expiry() -> None:
    payload["exp"] = datetime.utcnow() - timedelta(seconds=1)

    expired_token = jwt.encode(payload, SECRET, algorithm="HS256")

    with pytest.raises(ExpiredTokenBackendError):
        hmac_token_backend.decode(expired_token)


def test_decode_hmac_with_invalid_sig() -> None:
    payload["exp"] = datetime.utcnow() + timedelta(days=1)
    token_1 = jwt.encode(payload, SECRET, algorithm="HS256")
    payload["foo"] = "baz"
    token_2 = jwt.encode(payload, SECRET, algorithm="HS256")

    token_2_payload = token_2.rsplit(".", 1)[0]
    token_1_sig = token_1.rsplit(".", 1)[-1]
    invalid_token = token_2_payload + "." + token_1_sig

    with pytest.raises(TokenBackendError):
        hmac_token_backend.decode(invalid_token)


def test_decode_hmac_with_invalid_sig_no_verify() -> None:
    payload["exp"] = datetime.utcnow() + timedelta(days=1)
    token_1 = jwt.encode(payload, SECRET, algorithm="HS256")
    payload["foo"] = "baz"
    token_2 = jwt.encode(payload, SECRET, algorithm="HS256")
    # Payload copied
    payload["exp"] = datetime_to_epoch(payload["exp"])

    token_2_payload = token_2.rsplit(".", 1)[0]
    token_1_sig = token_1.rsplit(".", 1)[-1]
    invalid_token = token_2_payload + "." + token_1_sig

    assert hmac_token_backend.decode(invalid_token, verify=False) == payload


def test_decode_hmac_success() -> None:
    payload["exp"] = datetime.utcnow() + timedelta(days=1)
    payload["foo"] = "baz"

    token = jwt.encode(payload, SECRET, algorithm="HS256")
    # Payload copied
    payload["exp"] = datetime_to_epoch(payload["exp"])

    assert hmac_token_backend.decode(token) == payload


def test_decode_rsa_with_no_expiry() -> None:
    no_exp_token = jwt.encode(payload, PRIVATE_KEY, algorithm="RS256")

    rsa_token_backend.decode(no_exp_token)


def test_decode_rsa_with_no_expiry_no_verify() -> None:
    no_exp_token = jwt.encode(payload, PRIVATE_KEY, algorithm="RS256")

    assert hmac_token_backend.decode(no_exp_token, verify=False) == payload


def test_decode_rsa_with_expiry() -> None:
    payload["exp"] = datetime.utcnow() - timedelta(seconds=1)

    expired_token = jwt.encode(payload, PRIVATE_KEY, algorithm="RS256")

    with pytest.raises(ExpiredTokenBackendError):
        rsa_token_backend.decode(expired_token)


def test_decode_rsa_with_invalid_sig() -> None:
    payload["exp"] = datetime.utcnow() + timedelta(days=1)
    payload["foo"] = "baz"
    token = jwt.encode(payload, PRIVATE_KEY, algorithm="RS256")

    token_payload = token.rsplit(".", 1)[0]
    token_sig = token.rsplit(".", 1)[-1]
    invalid_token = f"{token_payload}.{token_sig}a"

    with pytest.raises(TokenBackendError):
        rsa_token_backend.decode(invalid_token)


def test_decode_rsa_with_invalid_sig_no_verify() -> None:
    payload["exp"] = datetime.utcnow() + timedelta(days=1)
    payload["foo"] = "baz"
    token = jwt.encode(payload, PRIVATE_KEY, algorithm="RS256")

    token_payload = token.rsplit(".", 1)[0]
    token_sig = token.rsplit(".", 1)[-1]
    invalid_token = f"{token_payload}.{token_sig}a"

    # Payload copied
    payload["exp"] = datetime_to_epoch(payload["exp"])

    assert hmac_token_backend.decode(invalid_token, verify=False) == payload


def test_decode_rsa_success() -> None:
    payload["exp"] = datetime.utcnow() + timedelta(days=1)
    payload["foo"] = "baz"

    token = jwt.encode(payload, PRIVATE_KEY, algorithm="RS256")
    # Payload copied
    payload["exp"] = datetime_to_epoch(payload["exp"])

    assert rsa_token_backend.decode(token) == payload


def test_decode_aud_iss_success() -> None:
    payload["exp"] = datetime.utcnow() + timedelta(days=1)
    payload["foo"] = "baz"
    payload["aud"] = AUDIENCE
    payload["iss"] = ISSUER

    token = jwt.encode(payload, PRIVATE_KEY, algorithm="RS256")
    # Payload copied
    payload["exp"] = datetime_to_epoch(payload["exp"])

    assert aud_iss_token_backend.decode(token) == payload


def test_decode_when_algorithm_not_available() -> None:
    token = jwt.encode(payload, PRIVATE_KEY, algorithm="RS256")

    pyjwt_without_rsa = PyJWS()
    pyjwt_without_rsa.unregister_algorithm("RS256")
    with patch.object(jwt, "decode", new=pyjwt_without_rsa.decode):
        with pytest.raises(TokenBackendError, match=r"Invalid algorithm specified"):
            rsa_token_backend.decode(token)


def test_decode_when_token_algorithm_does_not_match() -> None:
    token = jwt.encode(payload, PRIVATE_KEY, algorithm="RS256")

    with pytest.raises(TokenBackendError, match=r"Invalid algorithm specified"):
        hmac_token_backend.decode(token)
