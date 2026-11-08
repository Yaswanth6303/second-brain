import { type FormEvent, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "../../../components/ui/Button.tsx";
import { Field } from "../../../components/ui/Field.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { useAuth } from "../AuthContext.tsx";
import * as authApi from "../api/auth.ts";
import { AuthLayout, FormAlert, FormHead } from "../components/AuthLayout.tsx";
import { PasswordInput } from "../components/PasswordInput.tsx";
import { type Errors, apiErrors, loginSchema, parseForm } from "../schemas.ts";

export function LoginPage() {
  const { setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/library";
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { data, errors } = parseForm(loginSchema, e.currentTarget);
    setErrors(errors);
    if (!data) return;
    setBusy(true);
    try {
      const user = await authApi.login(data);
      setUser(user);
      toast(`Welcome back, ${user.name.split(" ")[0]}`);
      void navigate(from, { replace: true });
    } catch (err) {
      setErrors(apiErrors(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout mode="login">
      <form className="flex flex-col gap-3.5" noValidate onSubmit={onSubmit}>
        <FormHead title="Welcome back" sub="Log in to open your library." />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email}
        />
        <PasswordInput
          label="Password"
          name="password"
          autoComplete="current-password"
          error={errors.password}
          labelEnd={
            <Link to="/forgot" className="linkish meta">
              Forgot password?
            </Link>
          }
        />
        <label className="flex items-center gap-2">
          <input type="checkbox" name="remember" defaultChecked className="check" />
          Keep me logged in on this device
        </label>
        <FormAlert>{errors.form}</FormAlert>
        <Button type="submit" size="lg" disabled={busy}>
          Log in
        </Button>
        <p className="meta mb-0 text-center">
          New here?{" "}
          <Link to="/signup" className="linkish">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
