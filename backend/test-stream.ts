async function testStream() {
  const TOKEN =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc4MDA3NzIwMCwiZXhwIjoxNzgwMTY3MjAwfQ.jIhqasyQunfDMjG6awywwM2prAIKYBSVVS9qWeE6Z5c";
  const SESSION_ID = "6122b105-9ff5-4261-8944-ab8c746c2fe2";

  const response = await fetch(
    `http://localhost:3000/api/interview/sessions/${SESSION_ID}/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ content: "teste" }),
    },
  );

  console.log("Status:", response.status);

  if (!response.ok) {
    const err = await response.text();
    console.error("Erro:", err);
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    process.stdout.write(chunk);
  }
}

testStream().catch(console.error);
