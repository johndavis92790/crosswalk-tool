import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import { useUserContext } from "../contexts/UserContext";
import { Navbar } from "react-bootstrap";

export function CrosswalkNavbar({ sticky = true }) {
  const contextValue = useUserContext();
  const { user, signInWithGoogle, handleSignOut } = contextValue ?? {
    user: null,
  };
  return (
    <>
      <Navbar bg="light" expand="lg" sticky={sticky ? "top" : undefined}>
        <Container className="nav-container">
          <Navbar.Brand></Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Nav className="me-auto">
            <Nav.Link href="/">HOME</Nav.Link>
            <Nav.Link href="/JsonUpload">JsonUpload</Nav.Link>
            {user ? (
              <>
                <Nav.Link onClick={handleSignOut}>LOGOUT</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link onClick={signInWithGoogle}>LOGIN</Nav.Link>
              </>
            )}
          </Nav>
        </Container>
      </Navbar>
    </>
  );
}
