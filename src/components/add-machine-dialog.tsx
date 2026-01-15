import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addMachine,
  getMachines,
  type MachineConfig,
  type MachineType,
  slugify,
} from "@/lib/machines-storage";
import { cn } from "@/lib/utils";

interface AddMachineDialogProps {
  onMachineAdded?: () => void;
}

export function AddMachineDialog({ onMachineAdded }: AddMachineDialogProps) {
  const [open, setOpen] = useState(false);
  const [machineType, setMachineType] = useState<MachineType>("provider");
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [newApiUrl, setNewApiUrl] = useState("");
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);

  // Compute the auto-generated ID
  const autoId = useMemo(() => slugify(newName), [newName]);
  const effectiveId = idManuallyEdited ? newId : autoId;

  // Check if ID already exists
  const isDuplicateId = useMemo(() => {
    if (!effectiveId.trim()) return false;
    const existingMachines = getMachines();
    return existingMachines.some((m) => m.id === effectiveId.trim());
  }, [effectiveId]);

  const resetForm = useCallback(() => {
    setNewName("");
    setNewId("");
    setNewApiUrl("");
    setIdManuallyEdited(false);
    setMachineType("provider");
  }, []);

  const handleAdd = useCallback(() => {
    if (!newName.trim() || !effectiveId.trim() || !newApiUrl.trim()) return;

    const machine: MachineConfig = {
      id: effectiveId.trim(),
      name: newName.trim(),
      apiUrl: newApiUrl.trim(),
      type: machineType,
    };

    addMachine(machine);
    resetForm();
    setOpen(false);
    onMachineAdded?.();
  }, [newName, effectiveId, newApiUrl, machineType, resetForm, onMachineAdded]);

  const handleIdChange = (value: string) => {
    setNewId(value);
    setIdManuallyEdited(true);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  const isValid =
    newName.trim() && effectiveId.trim() && newApiUrl.trim() && !isDuplicateId;

  const typeLabel = machineType === "provider" ? "Provider" : "Requestor";
  const apiUrlPlaceholder =
    machineType === "provider"
      ? "e.g., https://example.com/process_info.json"
      : "e.g., https://example.com/status.json";
  const apiUrlHint =
    machineType === "provider"
      ? "Full URL to the process_info.json endpoint"
      : "Full URL to the system status JSON endpoint";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Machine
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Machine</DialogTitle>
          <DialogDescription>
            Add a new machine to track. Select the type and provide the API URL.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Type Toggle */}
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex rounded-lg border p-1">
              <button
                type="button"
                onClick={() => setMachineType("provider")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  machineType === "provider"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Provider
              </button>
              <button
                type="button"
                onClick={() => setMachineType("requestor")}
                className={cn(
                  "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  machineType === "requestor"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Requestor
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder={
                machineType === "provider"
                  ? "e.g., Geode 0"
                  : "e.g., Estimator 1"
              }
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="id">ID</Label>
            <Input
              id="id"
              placeholder={
                machineType === "provider"
                  ? "e.g., geode-0"
                  : "e.g., estimator-1"
              }
              value={effectiveId}
              onChange={(e) => handleIdChange(e.target.value)}
              className={
                isDuplicateId ? "border-red-500 focus-visible:ring-red-500" : ""
              }
            />
            {isDuplicateId ? (
              <p className="text-xs text-red-500">
                A machine with this ID already exists
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Used internally to identify the {typeLabel.toLowerCase()}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <Input
              id="apiUrl"
              placeholder={apiUrlPlaceholder}
              value={newApiUrl}
              onChange={(e) => setNewApiUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{apiUrlHint}</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!isValid}>
            Add {typeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
