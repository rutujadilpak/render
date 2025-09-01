import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, ArrowLeft, CheckCircle, Clock } from "lucide-react";
import { Enquiry, ServiceType, ServiceTypeStatus } from "@/types";
import { enquiriesStorage, workflowHelpers, imageUploadHelper } from "@/utils/localStorage";

interface ServiceTypeDetailProps {
  enquiryId: number;
  serviceType: ServiceType;
  onBack: () => void;
}

export function ServiceTypeDetail({ enquiryId, serviceType, onBack }: ServiceTypeDetailProps) {
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceTypeStatus | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const loadEnquiry = () => {
      const allEnquiries = enquiriesStorage.getAll();
      const foundEnquiry = allEnquiries.find(e => e.id === enquiryId);
      if (foundEnquiry) {
        setEnquiry(foundEnquiry);
        const service = foundEnquiry.serviceDetails?.serviceTypes?.find(s => s.type === serviceType);
        setServiceStatus(service || null);
      }
    };
    
    loadEnquiry();
    const interval = setInterval(loadEnquiry, 2000);
    return () => clearInterval(interval);
  }, [enquiryId, serviceType]);

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

  const startService = () => {
    if (!enquiry || !selectedImage) return;

    const allEnquiries = enquiriesStorage.getAll();
    const updatedEnquiries = allEnquiries.map((e) =>
      e.id === enquiryId
        ? {
            ...e,
            serviceDetails: {
              ...e.serviceDetails!,
              serviceTypes: e.serviceDetails!.serviceTypes.map(service =>
                service.type === serviceType
                  ? {
                      ...service,
                      status: "in-progress" as const,
                      photos: {
                        ...service.photos,
                        beforePhoto: selectedImage,
                        beforeNotes: notes,
                      },
                      startedAt: new Date().toISOString(),
                    }
                  : service
              )
            },
          }
        : e
    );
    
    enquiriesStorage.save(updatedEnquiries);
    setSelectedImage(null);
    setNotes("");
  };

  const completeService = () => {
    if (!enquiry || !selectedImage) return;

    const allEnquiries = enquiriesStorage.getAll();
    const updatedEnquiries = allEnquiries.map((e) =>
      e.id === enquiryId
        ? {
            ...e,
            serviceDetails: {
              ...e.serviceDetails!,
              serviceTypes: e.serviceDetails!.serviceTypes.map(service =>
                service.type === serviceType
                  ? {
                      ...service,
                      status: "done" as const,
                      photos: {
                        ...service.photos,
                        afterPhoto: selectedImage,
                        afterNotes: notes,
                      },
                      completedAt: new Date().toISOString(),
                    }
                  : service
              )
            },
          }
        : e
    );
    
    enquiriesStorage.save(updatedEnquiries);
    setSelectedImage(null);
    setNotes("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500 text-white";
      case "in-progress":
        return "bg-blue-500 text-white";
      case "done":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (!enquiry || !serviceStatus) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading service details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in p-2 sm:p-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {serviceType}
            </h1>
            <p className="text-sm text-muted-foreground">
              {enquiry.customerName} - {enquiry.product}
            </p>
          </div>
        </div>
        <Badge className={`${getStatusColor(serviceStatus.status)} text-sm px-3 py-1`}>
          {serviceStatus.status}
        </Badge>
      </div>

      {/* Compact Info */}
      <Card className="p-4 bg-gradient-card border-0 shadow-soft">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><span className="font-medium">Status:</span> {serviceStatus.status}</p>
            <p><span className="font-medium">Amount:</span> ₹{enquiry.quotedAmount || 0}</p>
          </div>
          <div>
            {serviceStatus.startedAt && (
              <p><span className="font-medium">Started:</span> {new Date(serviceStatus.startedAt).toLocaleDateString()}</p>
            )}
            {serviceStatus.completedAt && (
              <p><span className="font-medium">Completed:</span> {new Date(serviceStatus.completedAt).toLocaleDateString()}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Photos Section - Compact */}
      <div className="grid grid-cols-2 gap-4">
        {/* Before Photo */}
        <Card className="p-4 bg-gradient-card border-0 shadow-soft">
          <h3 className="text-sm font-semibold text-foreground mb-2">Before Photo</h3>
          {serviceStatus.photos.beforePhoto ? (
            <div className="space-y-2">
              <img
                src={serviceStatus.photos.beforePhoto}
                alt="Before service"
                className="w-full h-32 object-cover rounded-md border"
              />
              {serviceStatus.photos.beforeNotes && (
                <p className="text-xs text-muted-foreground">{serviceStatus.photos.beforeNotes}</p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Camera className="h-8 w-8 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No before photo</p>
            </div>
          )}
        </Card>

        {/* After Photo */}
        <Card className="p-4 bg-gradient-card border-0 shadow-soft">
          <h3 className="text-sm font-semibold text-foreground mb-2">After Photo</h3>
          {serviceStatus.photos.afterPhoto ? (
            <div className="space-y-2">
              <img
                src={serviceStatus.photos.afterPhoto}
                alt="After service"
                className="w-full h-32 object-cover rounded-md border"
              />
              {serviceStatus.photos.afterNotes && (
                <p className="text-xs text-muted-foreground">{serviceStatus.photos.afterNotes}</p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Camera className="h-8 w-8 mx-auto mb-1 opacity-50" />
              <p className="text-xs">No after photo</p>
            </div>
          )}
        </Card>
      </div>

      {/* Action Section - Compact */}
      <Card className="p-4 bg-gradient-card border-0 shadow-soft">
        <h3 className="text-sm font-semibold text-foreground mb-3">Actions</h3>
        
        {serviceStatus.status === "pending" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Take Before Photo</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="before-photo"
                />
                <Label
                  htmlFor="before-photo"
                  className="cursor-pointer flex items-center justify-center space-x-2 border border-input bg-background px-3 py-2 text-xs ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md flex-1"
                >
                  <Camera className="h-3 w-3" />
                  <span>Take Photo</span>
                </Label>
              </div>
              {selectedImage && (
                <div className="mt-2">
                  <img
                    src={selectedImage}
                    alt="Before photo preview"
                    className="w-full h-24 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Notes (Optional)</Label>
              <Textarea
                placeholder="Add notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
            
            <Button
              onClick={startService}
              className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
              disabled={!selectedImage}
            >
              <Clock className="h-3 w-3 mr-1" />
              Start Service
            </Button>
          </div>
        )}

        {serviceStatus.status === "in-progress" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs">Take After Photo</Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="after-photo"
                />
                <Label
                  htmlFor="after-photo"
                  className="cursor-pointer flex items-center justify-center space-x-2 border border-input bg-background px-3 py-2 text-xs ring-offset-background hover:bg-accent hover:text-accent-foreground rounded-md flex-1"
                >
                  <Camera className="h-3 w-3" />
                  <span>Take Photo</span>
                </Label>
              </div>
              {selectedImage && (
                <div className="mt-2">
                  <img
                    src={selectedImage}
                    alt="After photo preview"
                    className="w-full h-24 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs">Work Notes (Optional)</Label>
              <Textarea
                placeholder="Add work notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
            
            <Button
              onClick={completeService}
              className="w-full bg-green-600 hover:bg-green-700 text-sm"
              disabled={!selectedImage}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Complete Service
            </Button>
          </div>
        )}

        {serviceStatus.status === "done" && (
          <div className="text-center py-4">
            <CheckCircle className="h-8 w-8 mx-auto mb-1 text-green-500" />
            <p className="text-sm font-semibold text-foreground">Service Completed!</p>
            <p className="text-xs text-muted-foreground">
              This service has been completed successfully.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
