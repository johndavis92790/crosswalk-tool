import { Card, Button } from "react-bootstrap";
import { useUserContext } from "../contexts/UserContext";

export function Login() {
  const contextValue = useUserContext();
  const { user, signInWithGoogle, handleSignOut } = contextValue ?? {
    user: null,
  };

  return (
    <>
      <Card>
        <Card.Body>
          {user ? (
            <>
              <h1>Welcome, {user.displayName}</h1>
              <Button onClick={handleSignOut}>Sign out</Button>
            </>
          ) : (
            <>
              <h1>Please sign in</h1>
              <Button onClick={signInWithGoogle}>Sign in with Google</Button>
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
}
