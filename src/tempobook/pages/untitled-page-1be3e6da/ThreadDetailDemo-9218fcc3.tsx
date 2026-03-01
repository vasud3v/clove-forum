import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function ThreadDetailDemo() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/thread/t1");
  }, []);

  return (
    <div className="min-h-screen bg-[#030304] flex items-center justify-center">
      <p className="text-[#6b6b80] font-mono text-sm">Redirecting to thread...</p>
    </div>
  );
}
