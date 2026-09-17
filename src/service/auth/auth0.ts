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
    audience,
    issuer,
    jwksUrl: new URL(
      `${issuer}.well-known/jwks.json`
    ),
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

export async function verifyAccessToken(
  authorizationHeader?: string
) {
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