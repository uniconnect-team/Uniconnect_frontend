import { BottomMenu } from "../../../components/BottomMenu";
import { Icon } from "../../../components/Icon";
import { useNavigate } from "react-router-dom";

export function Properties() {
  const navigate = useNavigate();

  return (
    <>
      <div className="space-y-6 pb-20">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Go back"
          >
            <Icon name="chevron-left" />
          </button>
          <h1 className="text-lg font-semibold">Your Properties</h1>
        </header>

        <div className="min-h-[60vh] flex items-center justify-center text-center">
          <div className="space-y-2">
            <p className="text-base font-medium text-gray-900">
              Manage your dorm listings
            </p>
            <p className="text-sm text-gray-400">
              Keep track of your properties and update their details right here.
            </p>
          </div>
        </div>
      </div>

      <BottomMenu />
    </>
  );
}
