// TODO: Reativar quando auth MVC estiver implementada (T31)
// Por enquanto, dashboard é acessível sem autenticação

import Dashboard from "./dashboard";

export default async function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome (Auth MVC em implementação)</p>
      <Dashboard />
    </div>
  );
}
