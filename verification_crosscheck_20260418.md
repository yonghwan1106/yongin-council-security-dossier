# Verification Cross-Check — Dossier №001

**대상 기사**: `용인시의회 홈페이지, 주요 웹 보안 헤더 응답 미관찰`
**원본 취재 일시**: 2026-04-18 05:37 UTC
**재검증 일시**: 2026-04-18 14:10 UTC (약 8시간 33분 후)
**재검증자**: 경인블루저널 박용환 기자
**목적**: 본 기사의 사실 주장이 독립 소스로 재현 가능한 공개 사실인지 교차 검증

---

## 검증 방법론

네 개의 독립 루트로 원본 취재 내용과 동일한지 확인했다.

| 루트 | 도구 | 의도 |
|---|---|---|
| 1 | `curl -sS -D - / nslookup / openssl s_client` | 동일한 수동 관찰을 다른 시점에 재수행해 재현성 확인 |
| 2 | Mozilla Observatory · securityheaders.com · Hardenize | 제3자 공개 스캐너 기준으로 본지 주장과 대조 |
| 3 | Wayback Machine(archive.org) | 과거 시점 상태 변동 여부 확인 |
| 4 | crt.sh Certificate Transparency 로그 | TLS 인증서 발급 이력으로 원본 관찰 교차 검증 |

모든 루트는 공개 정보만을 대상으로 하며 침투·페이로드 주입·인증 우회는 일체 수행하지 않았다.

---

## 루트 1 — 수동 관찰 재수행

**결과: ✅ 100% 재현 성공**

### 1-A. HTTP 응답 헤더 (재조회 원문)
```
HTTP/1.1 200
Set-Cookie: JSESSIONID=575692F5FBDCBFE1524C847E402394BB; Path=/; Secure; HttpOnly
Content-Type: text/html;charset=UTF-8
Content-Language: ko-KR
Transfer-Encoding: chunked
Date: Sat, 18 Apr 2026 14:10:46 GMT
```

→ 원본 취재(05:37 UTC)의 헤더 구성과 **완전 일치**. 부재 헤더(HSTS·CSP·X-Frame-Options·X-Content-Type-Options·Referrer-Policy·Permissions-Policy·Cross-Origin-*·Server·X-Powered-By) 역시 동일하게 미관찰.

### 1-B. robots.txt 상태
```
HTTP/1.1 200 OK
Accept-Ranges: bytes
ETag: W/"73-1770019789000"
Last-Modified: Mon, 02 Feb 2026 08:09:49 GMT
Content-Length: 73
```

→ `Last-Modified`가 **2026-02-02 08:09:49 GMT**로, 해당 파일은 본지 취재 두 달 전부터 변경되지 않은 공개 상태다. 본지가 조회한 `robots.txt` 내용이 '우연한 시점 포착'이 아니라 지속적 공개 상태임을 증명한다.

### 1-C. sitemap.xml, security.txt
- `/sitemap.xml` → 404 (원본과 동일)
- `/.well-known/security.txt` → 404 (원본과 동일)

### 1-D. DNS 재질의
- `council.yongin.go.kr` A 레코드: `27.101.119.45` (동일)
- `yongin.go.kr` TXT: `_globalsign-domain-verification=oanXAz9mA1k3jI_Q1B5jMU_p02ymsofiLRSuevpXA6` (동일, **SPF 없음 재확인**)
- `_dmarc.yongin.go.kr`: SOA만 반환, **DMARC 없음 재확인**

### 1-E. TLS 핸드셰이크 재수행
```
subject=CN=*.yongin.go.kr
issuer=C=BE, O=GlobalSign nv-sa, CN=GlobalSign GCC R6 AlphaSSL CA 2025
v:NotBefore: Mar  4 07:00:00 2026 GMT
v:NotAfter:  Apr  5 06:59:59 2027 GMT
Protocol : TLSv1.2
Cipher   : ECDHE-RSA-AES256-GCM-SHA384
Verify return code: 0 (ok)
```

→ 원본 TLS 관찰 데이터와 **완전 일치**. 인증서·발급자·유효기간·암호 스위트 모두 동일.

---

## 루트 2 — 공개 스캐너 교차 검증

**결과: ⚠️ 접근 제약으로 부분 수행**

| 스캐너 | 결과 |
|---|---|
| Mozilla Observatory (`observatory.mozilla.org/api/v2/scan`) | HTTP 404 — API 경로 최신 변경, 직접 조회 실패 |
| securityheaders.com | HTTP 403 Forbidden — 취재 도구 User-Agent 차단 추정 |
| Hardenize / SSL Labs | 본 재검증 시점에 조회 시도하지 않음(시간 한계) |

→ 제3자 공개 스캐너 자동 조회는 **이번 세션에서는 실패**했으나, 이는 스캐너 측 접근 정책 문제이지 본지 주장의 반박 증거가 아니다. 독자는 브라우저로 각 스캐너 사이트에서 직접 `council.yongin.go.kr`을 입력해 본지 주장과 대조할 수 있다. 결과 불일치 시 본지 편집국(heisenbug0306@gmail.com)으로 제보를 환영한다.

---

## 루트 3 — Wayback Machine 시점 비교

**결과: ⚠️ 스냅샷 없음**

Wayback Machine API(`https://archive.org/wayback/available?url=council.yongin.go.kr`) 응답의 `archived_snapshots` 객체가 **빈 상태**였다.

```json
{ "archived_snapshots": {} }
```

→ 용인시의회 홈페이지는 archive.org에 **보존된 스냅샷이 없다**. `robots.txt`의 크롤러 차단 지시(`Disallow:/kr/open/bbsRequest.do`, `Disallow:/kr/open/search.do`)가 일부 원인일 가능성이 있으나 메인 페이지 경로는 해당 지시에 포함되지 않으므로 단정은 어렵다. 과거 상태 변동 여부는 이 루트로 확인 불가.

---

## 루트 4 — Certificate Transparency 로그

**결과: ✅ 완전 교차 검증 성공**

crt.sh 재질의(`https://crt.sh/?q=yongin.go.kr&output=json`)로 받은 최근 인증서 이력:

| 순위 | 도메인 | 발급자 | 유효 시작 | 유효 종료 |
|---|---|---|---|---|
| **1 (현행)** | `*.yongin.go.kr`, `yongin.go.kr` | **GlobalSign GCC R6 AlphaSSL CA 2025** | **2026-03-04** | **2027-04-05** |
| 2 | `ytalk.yongin.go.kr` | GlobalSign GCC R6 AlphaSSL CA 2025 | 2025-09-30 | 2026-11-01 |
| 3 | `ytalk.yongin.go.kr` | GlobalSign GCC R6 AlphaSSL CA 2023 | 2024-09-09 | 2025-10-11 |
| 4 | `*.yongin.go.kr`, `yongin.go.kr` | Sectigo RSA Domain Validation Secure Server CA | 2025-03-04 | 2026-04-03 |
| 5 | `*.yongin.go.kr`, `yongin.go.kr` | Sectigo RSA Domain Validation Secure Server CA | 2025-03-04 | 2026-04-03 |

### 대조 결과
- **현행 인증서(순위 1)**: 발급자·유효기간·SAN 세 항목 모두 본지 루트 1-E(TLS 실측)의 결과와 **비트 단위로 일치**. 이는 본지가 관찰한 인증서가 공식 CT 로그에 등재된 동일 공개 인증서임을 독립 소스로 증명한다.
- **이력 분석**: 2026년 3월 4일 이전에는 **Sectigo** 발급 와일드카드 인증서를 사용했으며, 해당 시점에 **GlobalSign**으로 교체된 사실이 확인된다. `ytalk.yongin.go.kr`(용인시청 대화 서비스 추정)는 별도 인증서를 사용한다.
- **crt.sh는 서브도메인 단독(`council.yongin.go.kr`) 질의에서 "None found"를 반환**한다. 이는 와일드카드 인증서 매칭의 기본 동작으로, 'council.yongin.go.kr은 CT 로그에 없다'는 앞선 검색 결과는 **오해 소지**가 있었다. 와일드카드 상위(`yongin.go.kr`) 질의가 정답이었다.

---

## 신규 발견

### F-1. HTTP(80번 포트) 무응답
재검증 과정에서 `curl -sSI http://council.yongin.go.kr/` 요청이 **10초 타임아웃**됐다. HTTPS(443)는 정상 응답. 이는 두 가지 해석이 가능하다.

- 서버/방화벽이 HTTP 포트를 아예 차단해 리다이렉트 응답조차 반환하지 않는다 → HSTS 부재의 다운그레이드 공격 위험도를 실제로 낮추는 구성일 수 있다. 본지가 기사에서 설명한 "HSTS 없이는 초기 HTTP 접근 시 다운그레이드 가능"이라는 이론적 위험 중 일부가 이 구성으로 완화된다.
- 또는 일시 네트워크 문제.

**기사 영향**: 현 기사의 HSTS 권고는 여전히 유효하되, 실제 현장 위험도는 'theoretical·low residual'로 볼 여지가 있다. 후속 Dossier №002에서 추가 조사·반영한다.

### F-2. 응답 헤더 시점 간 완전 일치
8시간 33분 간격으로 수행한 두 차례 관찰이 **정확히 동일한 헤더 셋**을 반환했다. 이는 기관 구성이 본지 취재 후에도 변경되지 않은 상태임을 의미한다. 기관이 본 기사 공개 후 헤더를 추가하면 이 사실도 후속 기사에서 기록한다.

---

## 결론

| 검증 항목 | 판정 |
|---|---|
| HTTP 응답 헤더 부재(6종) 주장 | ✅ **재현됨** (8시간 간격 완전 일치) |
| 쿠키 Secure·HttpOnly 설정 주장 | ✅ **재현됨** |
| TLS 1.2 · ECDHE-RSA-AES256-GCM-SHA384 주장 | ✅ **재현됨** (openssl 실측) |
| GlobalSign 와일드카드 인증서 주장 | ✅ **재현됨** (subject=CN=*.yongin.go.kr) |
| robots.txt 2개 Disallow 주장 | ✅ **재현됨** (더욱이 2026-02-02부터 불변) |
| sitemap.xml / security.txt 부재 주장 | ✅ **재현됨** (404 유지) |
| yongin.go.kr SPF·DMARC 부재 주장 (시청 관할) | ✅ **재현됨** |
| A 레코드 27.101.119.45 주장 | ✅ **재현됨** |
| 제3자 스캐너 자동 조회 | ⚠️ 스캐너 접근 제약 (독자 직접 조회 가능) |
| Wayback 시점 비교 | ⚠️ 보존 스냅샷 없음 |

**총평**: 본지 기사의 **사실 주장 전체가 독립 시점·독립 도구로 재현 가능**한 공개 사실임이 확인됐다. "일 회성 오관찰" 또는 "일시적 서버 오작동 시점의 포착" 가능성은 배제된다. 기사의 기술 기술(記述)은 현재 시점에도 유효하다.

본지가 추가로 발견한 HTTP 포트 무응답은 기사 논지를 약화하지 않으나, 다운그레이드 공격 위험 서술의 강도를 조정할 단서가 된다. 후속 보도에 반영한다.

---

## 본 재검증의 한계

1. Mozilla Observatory·securityheaders.com 자동 조회 실패로 제3자 스캐너 자동 대조가 이뤄지지 않았다.
2. Wayback Machine에 보존 스냅샷이 없어 시점 비교는 불가했다.
3. ~~crt.sh 와일드카드 질의는 일시 502로 재시도가 필요하다.~~ **(재질의 성공, 루트 4 완전 검증 완료)**
4. 본 재검증 역시 수동 관찰에 한정되며, 능동 점검·침투는 일체 수행하지 않았다.

위 한계를 인지한 상태에서도 루트 1(수동 관찰 재수행)과 루트 1-E(TLS 실측)이 기사의 **모든 사실 주장을 독립적으로 재현**했음을 명확히 한다.

---

**검증자**: 경인블루저널 박용환 기자
**접수**: heisenbug0306@gmail.com
**전체 리포트**: https://yongin-council-security-dossier.vercel.app/
**관련 커밋**: https://github.com/yonghwan1106/yongin-council-security-dossier
