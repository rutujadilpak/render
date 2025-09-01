import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Clock,
  User,
  Package,
  Shield,
  Plus,
  Search,
  Camera,
  Upload,
  Send,
  CheckCircle,
} from "lucide-react";
import { Enquiry, PickupStatus, ServiceType } from "@/types";
import { enquiriesStorage, workflowHelpers, imageUploadHelper } from "@/utils/localStorage";

export function PickupModule() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [receivedNotes, setReceivedNotes] = useState("");


  // Load pickup stage enquiries from localStorage on component mount and refresh periodically
  useEffect(() => {
    const loadPickupEnquiries = () => {
      const pickupEnquiries = workflowHelpers.getPickupEnquiries();
      setEnquiries(pickupEnquiries);
    };
    
    loadPickupEnquiries();
    
    // Refresh data every 2 seconds to catch updates from other modules
    const interval = setInterval(loadPickupEnquiries, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const scheduledPickups = enquiries.filter((e) =>
    e.pickupDetails?.status === "scheduled"
  ).length;
  const assignedPickups = enquiries.filter((e) =>
    e.pickupDetails?.status === "assigned"
  ).length;
  const collectedPickups = enquiries.filter((e) =>
    e.pickupDetails?.status === "collected"
  ).length;
  const receivedPickups = enquiries.filter((e) =>
    e.pickupDetails?.status === "received"
  ).length;

  const filteredEnquiries = enquiries.filter(
    (enquiry) =>
      enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: PickupStatus) => {
    switch (status) {
      case "scheduled":
        return "bg-yellow-500 text-white";
      case "assigned":
        return "bg-blue-500 text-white";
      case "collected":
        return "bg-purple-500 text-white";
      case "received":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const assignPickup = (enquiryId: number, assignedTo: string) => {
    const updatedEnquiries = enquiries.map((enquiry) =>
      enquiry.id === enquiryId
        ? {
            ...enquiry,
            pickupDetails: {
              ...enquiry.pickupDetails!,
              status: "assigned" as PickupStatus,
              assignedTo,
            },
          }
        : enquiry
    );
    
    setEnquiries(updatedEnquiries);
    // Update in localStorage
    const allEnquiries = enquiriesStorage.getAll();
    const updatedAllEnquiries = allEnquiries.map((enquiry) => {
      const updated = updatedEnquiries.find((u) => u.id === enquiry.id);
      return updated || enquiry;
    });
    enquiriesStorage.save(updatedAllEnquiries);
  };

  const markCollected = (enquiryId: number) => {
    const updatedEnquiries = enquiries.map((enquiry) =>
      enquiry.id === enquiryId
        ? {
            ...enquiry,
            pickupDetails: {
              ...enquiry.pickupDetails!,
              status: "collected" as PickupStatus,
              collectedAt: new Date().toISOString(),
              photos: {
                ...enquiry.pickupDetails!.photos,
                afterPhoto: selectedImage || undefined,
              },
            },
          }
        : enquiry
    );
    
    setEnquiries(updatedEnquiries);
    // Update in localStorage
    const allEnquiries = enquiriesStorage.getAll();
    const updatedAllEnquiries = allEnquiries.map((enquiry) => {
      const updated = updatedEnquiries.find((u) => u.id === enquiry.id);
      return updated || enquiry;
    });
    enquiriesStorage.save(updatedAllEnquiries);

    // Reset form
    setSelectedImage(null);

    // Send WhatsApp notification
    const enquiry = enquiries.find((e) => e.id === enquiryId);
    if (enquiry) {
      alert(
        `WhatsApp sent to ${enquiry.customerName}!\n"Your ${enquiry.product} has been collected successfully."`
      );
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const thumbnailData = await imageUploadHelper.handleImageUpload(file);
        setSelectedImage(thumbnailData);
      } catch (error) {
        console.error('Failed to process image:', error);
        alert('Failed to process image. Please try again.');
      }
    }
  };

  const itemReceived = (enquiryId: number) => {
    const currentTime = new Date().toISOString();
    
    // Update enquiry to transition to service stage
    const allEnquiries = enquiriesStorage.getAll();
    const updatedEnquiries = allEnquiries.map((enquiry) =>
      enquiry.id === enquiryId
        ? {
            ...enquiry,
            currentStage: "service" as const,
            pickupDetails: {
              ...enquiry.pickupDetails!,
              status: "received" as PickupStatus,
              photos: {
                ...enquiry.pickupDetails!.photos,
                beforePhoto: selectedImage || undefined,
              },
              collectionNotes: receivedNotes,
            },
            serviceDetails: {
              overallPhotos: {
                beforePhoto: selectedImage || undefined,
                beforeNotes: receivedNotes,
              },
              serviceTypes: [],
              estimatedCost: enquiry.quotedAmount || 0,
            },
          }
        : enquiry
    );
    
    enquiriesStorage.save(updatedEnquiries);
    
    // Refresh pickup enquiries (the item will disappear since it's now in service stage)
    const updatedPickupEnquiries = workflowHelpers.getPickupEnquiries();
    setEnquiries(updatedPickupEnquiries);

    // Reset form
    setSelectedImage(null);
    setReceivedNotes("");

    // Send WhatsApp notification
    const enquiry = enquiries.find((e) => e.id === enquiryId);
    if (enquiry) {
      alert(
        `WhatsApp sent to ${enquiry.customerName}!\n"We have received your ${enquiry.product} and it has been moved to service department."`
      );
    }
  };

  const sendInvoice = (enquiry: Enquiry) => {
    // Here you would typically send invoice via WhatsApp/Email
    console.log(
      `Sending invoice to ${enquiry.customerName} at ${enquiry.phone}`
    );
    alert(`Invoice sent to ${enquiry.customerName}!`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Pickup Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage pickup schedules and collections from CRM enquiries
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {scheduledPickups}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Scheduled Pickups
              </div>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {assignedPickups}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Assigned
              </div>
            </div>
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {collectedPickups}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Collected
              </div>
            </div>
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {receivedPickups}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Received
              </div>
            </div>
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-success" />
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search pickups by customer, address, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Pickup Items */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Pickup Workflow
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {filteredEnquiries.map((enquiry) => (
            <Card
              key={enquiry.id}
              className="p-4 sm:p-6 bg-gradient-card border-0 shadow-soft hover:shadow-medium transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-base sm:text-lg">
                    {enquiry.customerName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {enquiry.phone}
                  </p>
                </div>
                <Badge
                  className={`${getStatusColor(
                    enquiry.pickupDetails?.status || "scheduled"
                  )} text-xs self-start`}
                >
                  {enquiry.pickupDetails?.status || "scheduled"}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground break-words">
                    {enquiry.address}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-foreground">
                    {enquiry.product} ({enquiry.quantity} items)
                  </span>
                </div>

                {enquiry.pickupDetails?.scheduledTime && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">
                      Scheduled: {enquiry.pickupDetails.scheduledTime}
                    </span>
                  </div>
                )}

                {enquiry.pickupDetails?.assignedTo && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">
                      Assigned: {enquiry.pickupDetails.assignedTo}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-foreground">
                    Amount: ₹{enquiry.quotedAmount || 0}
                  </span>
                </div>

                {/* {enquiry.pickupDetails?.pin && (
                  <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded">
                    <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-mono text-foreground">
                      PIN: {enquiry.pickupDetails.pin}
                    </span>
                  </div>
                )} */}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs sm:text-sm"
                  onClick={() => sendInvoice(enquiry)}
                >
                  <Send className="h-3 w-3 mr-1" />
                  Send Invoice
                </Button>

                {enquiry.pickupDetails?.status === "scheduled" && (
                  <Button
                    size="sm"
                    className="bg-gradient-primary hover:opacity-90 text-xs sm:text-sm"
                    onClick={() => assignPickup(enquiry.id, "Staff Member")}
                  >
                    <User className="h-3 w-3 mr-1" />
                    Assign Pickup
                  </Button>
                )}

                {enquiry.pickupDetails?.status === "assigned" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
                      >
                        <Package className="h-3 w-3 mr-1" />
                        Mark Collected
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Mark as Collected</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Collection Proof Photo</Label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id={`collect-photo-${enquiry.id}`}
                            />
                            <Label
                              htmlFor={`collect-photo-${enquiry.id}`}
                              className="cursor-pointer flex items-center justify-center space-x-2 border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md flex-1"
                            >
                              <Camera className="h-4 w-4" />
                              <span>Take Photo</span>
                            </Label>
                          </div>
                          {selectedImage && (
                            <div className="mt-2">
                              <img
                                src={selectedImage}
                                alt="Collection proof"
                                className="w-full h-32 object-cover rounded-md border"
                              />
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => markCollected(enquiry.id)}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={!selectedImage}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Mark as Collected
                        </Button>
                        {!selectedImage && (
                          <p className="text-xs text-muted-foreground text-center">
                            Please upload a collection proof photo
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {enquiry.pickupDetails?.status === "collected" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Item Received
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Item Received - Move to Service</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">


                        <div className="space-y-2">
                          <Label>Received Condition Photo</Label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id={`received-photo-${enquiry.id}`}
                            />
                            <Label
                              htmlFor={`received-photo-${enquiry.id}`}
                              className="cursor-pointer flex items-center justify-center space-x-2 border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md flex-1"
                            >
                              <Camera className="h-4 w-4" />
                              <span>Take Photo</span>
                            </Label>
                          </div>
                          {selectedImage && (
                            <div className="mt-2">
                              <img
                                src={selectedImage}
                                alt="Received item condition"
                                className="w-full h-32 object-cover rounded-md border"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="notes">
                            Notes / Remarks (Optional)
                          </Label>
                          <Textarea
                            id="notes"
                            placeholder="Add any notes about the received item..."
                            value={receivedNotes}
                            onChange={(e) => setReceivedNotes(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <Button
                          onClick={() => itemReceived(enquiry.id)}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={!selectedImage}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Item Received - Send to Service
                        </Button>
                        {!selectedImage && (
                          <p className="text-xs text-muted-foreground text-center">
                            Please upload a received condition photo
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}