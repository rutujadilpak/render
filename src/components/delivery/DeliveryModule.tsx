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
  Truck,
  Home,
  Search,
  Camera,
  Upload,
  Send,
  CheckCircle,
  PenTool,
} from "lucide-react";
import { Enquiry, DeliveryStatus, DeliveryMethod } from "@/types";
import { enquiriesStorage, workflowHelpers, imageUploadHelper } from "@/utils/localStorage";

export function DeliveryModule() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [customerSignature, setCustomerSignature] = useState<string | null>(null);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod>("customer-pickup");
  const [scheduledDateTime, setScheduledDateTime] = useState("");

  // Load enquiries that are in delivery stage
  useEffect(() => {
    const loadDeliveryEnquiries = () => {
      const deliveryEnquiries = workflowHelpers.getDeliveryEnquiries();
      setEnquiries(deliveryEnquiries);
    };
    
    loadDeliveryEnquiries();
    
    // Refresh data every 2 seconds to catch updates from other modules
    const interval = setInterval(loadDeliveryEnquiries, 2000);
    
    return () => clearInterval(interval);
  }, []);

  const readyForDelivery = enquiries.filter(
    (e) => e.deliveryDetails?.status === "ready"
  ).length;
  const scheduledDeliveries = enquiries.filter(
    (e) => e.deliveryDetails?.status === "scheduled"
  ).length;
  const outForDelivery = enquiries.filter(
    (e) => e.deliveryDetails?.status === "out-for-delivery"
  ).length;
  const deliveredToday = enquiries.filter(
    (e) => e.deliveryDetails?.status === "delivered"
  ).length;

  const filteredEnquiries = enquiries.filter(
    (enquiry) =>
      enquiry.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enquiry.product.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: DeliveryStatus) => {
    switch (status) {
      case "ready":
        return "bg-blue-500 text-white";
      case "scheduled":
        return "bg-yellow-500 text-white";
      case "out-for-delivery":
        return "bg-purple-500 text-white";
      case "delivered":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
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

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const thumbnailData = await imageUploadHelper.handleImageUpload(file);
        setCustomerSignature(thumbnailData);
      } catch (error) {
        console.error('Failed to process signature:', error);
        alert('Failed to process signature. Please try again.');
      }
    }
  };

  const scheduleDelivery = (enquiryId: number, method: DeliveryMethod, scheduledTime: string) => {
    const updatedEnquiries = enquiries.map((enquiry) =>
      enquiry.id === enquiryId
        ? {
            ...enquiry,
            deliveryDetails: {
              ...enquiry.deliveryDetails!,
              status: "scheduled" as DeliveryStatus,
              deliveryMethod: method,
              scheduledTime,
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
    setSelectedDeliveryMethod("customer-pickup");
    setScheduledDateTime("");

    // Send WhatsApp notification
    const enquiry = enquiries.find((e) => e.id === enquiryId);
    if (enquiry) {
      alert(
        `WhatsApp sent to ${enquiry.customerName}!\n"Your ${enquiry.product} delivery has been scheduled for ${scheduledTime}."`
      );
    }
  };

  const markOutForDelivery = (enquiryId: number, assignedTo: string) => {
    const updatedEnquiries = enquiries.map((enquiry) =>
      enquiry.id === enquiryId
        ? {
            ...enquiry,
            deliveryDetails: {
              ...enquiry.deliveryDetails!,
              status: "out-for-delivery" as DeliveryStatus,
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

    // Send WhatsApp notification
    const enquiry = enquiries.find((e) => e.id === enquiryId);
    if (enquiry) {
      alert(
        `WhatsApp sent to ${enquiry.customerName}!\n"Your ${enquiry.product} is out for delivery. Expected delivery: ${enquiry.deliveryDetails?.scheduledTime}"`
      );
    }
  };

  const markDelivered = (enquiryId: number) => {
    const currentTime = new Date().toISOString();
    
    // Update in localStorage first
    const allEnquiries = enquiriesStorage.getAll();
    const updatedAllEnquiries = allEnquiries.map((enquiry) =>
      enquiry.id === enquiryId
        ? {
            ...enquiry,
            currentStage: "completed" as const,
            deliveryDetails: {
              ...enquiry.deliveryDetails!,
              status: "delivered" as DeliveryStatus,
              photos: {
                ...enquiry.deliveryDetails!.photos,
                afterPhoto: selectedImage || undefined,
              },
              customerSignature,
              deliveryNotes,
              deliveredAt: currentTime,
            },
          }
        : enquiry
    );
    
    enquiriesStorage.save(updatedAllEnquiries);
    
    // Refresh delivery enquiries (the item will disappear since it's now in completed stage)
    const updatedDeliveryEnquiries = workflowHelpers.getDeliveryEnquiries();
    setEnquiries(updatedDeliveryEnquiries);

    // Reset form
    setSelectedImage(null);
    setCustomerSignature(null);
    setDeliveryNotes("");

    // Send completion WhatsApp - use the updated enquiry data
    const updatedEnquiry = updatedAllEnquiries.find((e) => e.id === enquiryId);
    if (updatedEnquiry) {
      alert(
        `WhatsApp sent to ${updatedEnquiry.customerName}!\n"Your ${updatedEnquiry.product} has been delivered successfully. Thank you for choosing our service!"`
      );
    }
    
    console.log(`Item ${enquiryId} successfully moved to completed stage`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in p-2 sm:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Delivery Management
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage completed service deliveries and customer pickups
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {readyForDelivery}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Ready for Delivery
              </div>
            </div>
            <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {scheduledDeliveries}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Scheduled
              </div>
            </div>
            <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-warning" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {outForDelivery}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Out for Delivery
              </div>
            </div>
            <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-3 sm:p-4 bg-gradient-card border-0 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-2xl font-bold text-foreground">
                {deliveredToday}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                Delivered Today
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
            placeholder="Search deliveries by customer, address, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Delivery Items */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">
          Delivery Queue
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
                    enquiry.deliveryDetails?.status || "ready"
                  )} text-xs self-start`}
                >
                  {enquiry.deliveryDetails?.status || "ready"}
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

                {enquiry.deliveryDetails?.scheduledTime && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">
                      Scheduled: {enquiry.deliveryDetails.scheduledTime}
                    </span>
                  </div>
                )}

                {enquiry.deliveryDetails?.assignedTo && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-foreground">
                      Assigned: {enquiry.deliveryDetails.assignedTo}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-foreground">
                    Amount: ₹{enquiry.finalAmount || enquiry.quotedAmount || 0}
                  </span>
                </div>

                {/* DEBUG: Show what we have
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                  <div>DEBUG INFO:</div>
                  <div>Service afterPhoto: {enquiry.serviceDetails?.overallPhotos?.afterPhoto ? 'EXISTS' : 'MISSING'}</div>
                  <div>Delivery beforePhoto: {enquiry.deliveryDetails?.photos?.beforePhoto ? 'EXISTS' : 'MISSING'}</div>
                  <div>Current Stage: {enquiry.currentStage}</div>
                </div> */}

                {/* Show service final photo as before photo */}
                {enquiry.deliveryDetails?.photos?.beforePhoto && (
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">Service Completed Photo:</div>
                    <img
                      src={enquiry.deliveryDetails.photos.beforePhoto}
                      alt="Service completed"
                      className="w-full h-24 object-cover rounded-md border"
                    />
                  </div>
                )}

                {/* Fallback: Show service photo directly if delivery photo missing */}
                {!enquiry.deliveryDetails?.photos?.beforePhoto && enquiry.serviceDetails?.overallPhotos?.afterPhoto && (
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground mb-1">Service Final Photo (Direct):</div>
                    <img
                      src={enquiry.serviceDetails.overallPhotos.afterPhoto}
                      alt="Service completed"
                      className="w-full h-24 object-cover rounded-md border"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
                {enquiry.deliveryDetails?.status === "ready" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-gradient-primary hover:opacity-90 text-xs sm:text-sm"
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Schedule Delivery
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Schedule Delivery</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Delivery Method</Label>
                          <Select onValueChange={(value) => setSelectedDeliveryMethod(value as DeliveryMethod)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select delivery method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer-pickup">Customer Pickup</SelectItem>
                              <SelectItem value="home-delivery">Home Delivery</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Scheduled Time</Label>
                          <Input 
                            type="datetime-local" 
                            value={scheduledDateTime}
                            onChange={(e) => setScheduledDateTime(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}   // 👈 restrict past dates
                          />
                        </div>
                        <Button
                          onClick={() => {
                            if (scheduledDateTime) {
                              scheduleDelivery(enquiry.id, selectedDeliveryMethod, scheduledDateTime);
                            } else {
                              alert("Please select a scheduled time");
                            }
                          }}
                          className="w-full bg-gradient-primary hover:opacity-90"
                          disabled={!scheduledDateTime}
                        >
                          Schedule Delivery
                        </Button>
                        {!scheduledDateTime && (
                          <p className="text-xs text-muted-foreground text-center">
                            Please select a scheduled time
                          </p>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {enquiry.deliveryDetails?.status === "scheduled" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs sm:text-sm"
                    onClick={() => markOutForDelivery(enquiry.id, "Delivery Person")}
                  >
                    <Truck className="h-3 w-3 mr-1" />
                    Mark Out for Delivery
                  </Button>
                )}

                {enquiry.deliveryDetails?.status === "out-for-delivery" && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark Delivered
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Confirm Delivery</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Delivery Proof Photo</Label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              id={`delivery-photo-${enquiry.id}`}
                            />
                            <Label
                              htmlFor={`delivery-photo-${enquiry.id}`}
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
                                alt="Delivery proof"
                                className="w-full h-32 object-cover rounded-md border"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Customer Signature</Label>
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureUpload}
                            className="hidden"
                            id={`signature-${enquiry.id}`}
                          />
                          <Label
                            htmlFor={`signature-${enquiry.id}`}
                            className="cursor-pointer flex items-center justify-center space-x-2 border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md"
                          >
                            <PenTool className="h-4 w-4" />
                            <span>Upload Signature</span>
                          </Label>
                          {customerSignature && (
                            <div className="mt-2">
                              <img
                                src={customerSignature}
                                alt="Customer signature"
                                className="w-full h-20 object-contain rounded-md border"
                              />
                            </div>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="delivery-notes">
                            Delivery Notes (Optional)
                          </Label>
                          <Textarea
                            id="delivery-notes"
                            placeholder="Any notes about the delivery..."
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <Button
                          onClick={() => markDelivered(enquiry.id)}
                          className="w-full bg-green-600 hover:bg-green-700"
                          disabled={!selectedImage}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Confirm Delivery
                        </Button>
                        {!selectedImage && (
                          <p className="text-xs text-muted-foreground text-center">
                            Please upload a delivery proof photo to continue
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
