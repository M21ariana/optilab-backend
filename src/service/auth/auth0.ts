import {
  createRemoteJWKSet,
  jwtVerify,
} from "jose";

const getAuth0Config = () => {
  const domain = process.env.AUTH0_DOMAIN;
  const audience = process.env.AUTH0_AUDIENCE;

  if (!domain) {
    throw new Error(
      "AUTH0_DOMAIN is not configured."
    );
  }

  if (!audience) {
    throw new Error(
      "AUTH0_AUDIENCE is not configured."
    );
  }

  const issuer = `https://${domain}/`;

  return {
    domain,
    audience,
    issuer,
    jwksUrl: new URL(
      `${issuer}.well-known/jwks.json`
    ),
    userInfoUrl: `${issuer}userinfo`,
  };
};

let jwks:
  | ReturnType<typeof createRemoteJWKSet>
  | undefined;

const getJwks = () => {
  if (!jwks) {
    const { jwksUrl } = getAuth0Config();

    jwks = createRemoteJWKSet(jwksUrl);
  }

  return jwks;
};

const extractBearerToken = (
  authorizationHeader?: string
): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] =
    authorizationHeader.split(" ");

  if (
    scheme?.toLowerCase() !== "bearer" ||
    !token
  ) {
    throw new Error(
      "Invalid Authorization header."
    );
  }

  return token;
};

export async function verifyAccessToken(
  authorizationHeader?: string
) {
  const token = extractBearerToken(
    authorizationHeader
  );

  if (!token) {
    return null;
  }

  const { issuer, audience } =
    getAuth0Config();

  const { payload } = await jwtVerify(
    token,
    getJwks(),
    {
      issuer,
      audience,
      algorithms: ["RS256"],
    }
  );

  if (!payload.sub) {
    throw new Error(
      "Access token does not contain a subject."
    );
  }

  return {
    sub: payload.sub,
  };
}

type Auth0UserInfo = {
  sub: string;
  email?: string;
  name?: string;
};

export async function getAuth0UserInfo(
  authorizationHeader?: string
): Promise<Auth0UserInfo | null> {
  const token = extractBearerToken(
    authorizationHeader
  );

  if (!token) {
    return null;
  }

  const { userInfoUrl } =
    getAuth0Config();

  const response = await fetch(
    userInfoUrl,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `Auth0 userinfo request failed with status ${response.status}: ${body}`
    );
  }

  const userInfo =
    (await response.json()) as Auth0UserInfo;

  if (!userInfo.sub) {
    throw new Error(
      "Auth0 userinfo response does not contain a subject."
    );
  }

  return userInfo;
}