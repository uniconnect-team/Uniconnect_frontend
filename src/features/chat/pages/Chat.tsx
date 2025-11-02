import { Icon } from "../../../components/Icon";
import { useNavigate } from "react-router-dom";
import { BottomMenu } from "../../../components/BottomMenu";

export function Chat() {
  const navigate = useNavigate();

  return (
    <>
      <div className="space-y-6 pb-20">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <Icon name="chevron-left" />
          </button>
          <h1 className="text-lg font-semibold">Messages</h1>
        </header>
        
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-sm text-gray-400">
            No messages yet. Start a conversation!
          </p>
        </div>
      </div>
      
      <BottomMenu />
    </>
  );
}