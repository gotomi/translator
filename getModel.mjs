const res = await fetch("https://integrate.api.nvidia.com/v1/models", {
  headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` },
});
const { data } = await res.json();
console.log(data.map((m) => m.id));
