// TODO: Implementar client da auth MVC quando backend estiver pronto
// Por enquanto, stub para permitir build

export const authClient = {
  useSession: () => ({ data: null, isPending: false }),
  signIn: { email: async () => {} },
  signUp: { email: async () => {} },
  signOut: async () => {},
  getSession: async () => null,
  $Infer: { Session: null as unknown },
};
