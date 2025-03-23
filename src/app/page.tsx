"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Image from "next/image";

export default function Home() {
  // Upload image state
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processId, setProcessId] = useState<string | null>(null);

  // Detection type state - using a single state for mutually exclusive options
  const [detectionType, setDetectionType] = useState<string | undefined>(
    undefined
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setError(null);
    setResults(null);
    setProcessId(null);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please select an image to analyze");
      return;
    }

    if (!detectionType) {
      setError("Please select a detection type");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Using your existing API function with the type parameter
      const result = await detectDrug(file, detectionType);
      setResults(result);

      // If the API returns a process ID, save it
      if (result.process_id) {
        setProcessId(result.process_id);
      }
    } catch (err) {
      setError("An error occurred during detection. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container mx-auto py-10 px-4">
      {/* Upload Image Form */}
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Drug Detection</CardTitle>
          <CardDescription>
            Upload an image for drug detection analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="image">Upload Image</Label>
                <div className="grid w-full items-center gap-1.5">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Detection Type</Label>
                <RadioGroup
                  value={detectionType}
                  onValueChange={setDetectionType}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="label" id="label" />
                    <Label htmlFor="label" className="cursor-pointer">
                      Label Detection
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="packaging" id="packaging" />
                    <Label htmlFor="packaging" className="cursor-pointer">
                      Packaging Detection
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {preview && (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <div className="relative h-64 w-full">
                    <Image
                      src={preview || "/placeholder.svg"}
                      alt="Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !file}
              >
                {loading ? "Processing..." : "Analyze Image"}
              </Button>
            </div>
          </form>
        </CardContent>

        {processId && (
          <CardFooter className="flex flex-col items-start">
            <Alert className="w-full mb-4">
              <AlertTitle>Process ID</AlertTitle>
              <AlertDescription>
                Your detection process ID is:{" "}
                <span className="font-mono font-bold">{processId}</span>
              </AlertDescription>
            </Alert>
          </CardFooter>
        )}

        {results && (
          <CardFooter className="flex flex-col items-start">
            <h3 className="text-lg font-semibold mb-2">Detection Results</h3>
            <pre className="bg-muted p-4 rounded-md w-full overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}

async function detectDrug(imageFile: File, type: string) {
  // Đọc file thành base64
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(",")[1]); // Lấy phần base64 sau dấu phẩy
    };
    reader.readAsDataURL(imageFile);
  });

  // Gửi request với JSON
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/detect-drug`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64,
        type: type,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Detection failed");
  }

  return await response.json();
}
