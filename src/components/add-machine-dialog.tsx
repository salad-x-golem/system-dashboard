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
import { addMachine, type MachineConfig, slugify } from "@/lib/machines-storage";

interface AddMachineDialogProps {
  onMachineAdded?: () => void;
}

export function AddMachineDialog({ onMachineAdded }: AddMachineDialogProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newApiUrl, setNewApiUrl] = useState("");
  const [idManuallyEdited, setIdManuallyEdited] = useState(false);

  // Compute the auto-generated ID
  const autoId = useMemo(() => slugify(newName), [newName]);
  const effectiveId = idManuallyEdited ? newId : autoId;

  const resetForm = useCallback(() => {
    setNewName("");
    setNewId("");
    setNewLocation("");
    setNewApiUrl("");
    setIdManuallyEdited(false);
  }, []);

  const handleAdd = useCallback(() => {
    if (!newName.trim() || !effectiveId.trim() || !newApiUrl.trim()) return;

    const machine: MachineConfig = {
      id: effectiveId.trim(),
      name: newName.trim(),
      location: newLocation.trim() || "Unknown",
      apiUrl: newApiUrl.trim(),
    };

    addMachine(machine);
    resetForm();
    setOpen(false);
    onMachineAdded?.();
  }, [newName, effectiveId, newLocation, newApiUrl, resetForm, onMachineAdded]);

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

  const isValid = newName.trim() && effectiveId.trim() && newApiUrl.trim();

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
            Add a new machine to track. The API URL should be the full URL to
            the JSON endpoint.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Geode 0"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="id">ID</Label>
            <Input
              id="id"
              placeholder="e.g., geode-0"
              value={effectiveId}
              onChange={(e) => handleIdChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Used internally to identify the machine
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Falkenstein"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiUrl">API URL</Label>
            <Input
              id="apiUrl"
              placeholder="e.g., https://polygongas.org/machine1/process_info.json"
              value={newApiUrl}
              onChange={(e) => setNewApiUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Full URL to the process_info.json endpoint
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!isValid}>
            Add Machine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
