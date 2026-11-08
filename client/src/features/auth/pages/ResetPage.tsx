import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Button } from "../../../components/ui/Button.tsx";
import { useToast } from "../../../components/ui/Toast.tsx";
import { useAuth } from "../AuthContext.tsx";
import * as authApi from "../api/auth.ts";
import { AuthLayout, FormAlert, FormHead } from "../components/AuthLayout.tsx";
import { PasswordInput } from "../components/PasswordInput.tsx";
import { StrengthMeter } from "../components/StrengthMeter.tsx";
import { type Errors, apiErrors, parseForm, resetSchema } from "../schemas.ts";

export function ResetPage() {
  const { token = "" } = useParams();
  const { setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Errors>({});
  const [password, setPassword] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { data, errors } = parseForm(resetSchema, e.currentTarget);
    setErrors(errors);
    if (!data) return;
    try {
      setUser(await authApi.reset({ token, password: data.password }));
      toast("Password changed");
      void navigate("/library", { replace: true });
    } catch (err) {
      setErrors(apiErrors(err));
    }
  }

  return (
    <AuthLayout mode="login">
      <form className="flex flex-col gap-3.5" noValidate onSubmit={onSubmit}>
        <FormHead title="Choose a new password" sub="You will be logged in straight after." />
        <div>
          <PasswordInput
            label="New password"
            name="password"
            autoComplete="new-password"
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <StrengthMeter password={password} />
        </div>
        <FormAlert>
          {errors.form && (
            <>
              {errors.form}{" "}
              <Link to="/forgot" className="linkish">
                Send a new link
              </Link>
            </>
          )}
        </FormAlert>
        <Button type="submit" size="lg">
          Save password
        </Button>
      </form>
    </AuthLayout>
  );
}
