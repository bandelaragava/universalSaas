import re

with open(r'C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# We need to move the `useEffect` and `fetchReceivedProducts` below the `useState` declarations.

# Find the block we inserted:
block = """
  const fetchReceivedProducts = async (reqId: string | number) => {
    try {
      const res = await rolesApi.get(`/vendors/received-products/requirement/${reqId}`);
      setReceivedProducts(res.data.data || []);
    } catch (e) {
      console.error("Error fetching received products", e);
    }
  };

  useEffect(() => {
    if (isViewReqOpen && selectedReq) {
      fetchReceivedProducts(selectedReq.id);
    }
  }, [isViewReqOpen, selectedReq]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await rolesApi.post(`/vendors/received-products/${assignData.receivedProductId}/assign`, {
        userId: parseInt(assignData.userId as any),
        quantity: assignData.quantity
      });
      setIsAssignOpen(false);
      if (selectedReq) fetchReceivedProducts(selectedReq.id);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to assign product");
    } finally {
      setIsSubmitting(false);
    }
  };
"""

# Since handleAssign uses isSubmitting, assignData, etc., it must be below all state declarations.
# Let's just find the entire block and move it. We can do a regex to extract the chunk, remove it, and append it right before fetchRequirements.

# Actually, the easiest way is to re-download the original file, and apply the patches safely at the right places.
# But I can just do string replacements.

state_block = """  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isAddReqOpen, setIsAddReqOpen] = useState(false);
  const [isViewReqOpen, setIsViewReqOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Requirement | null>(null);
  const [receivedProducts, setReceivedProducts] = useState<any[]>([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignData, setAssignData] = useState({ receivedProductId: 0, quantity: 1, userId: '' });
  const [users, setUsers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);"""

# The file looks like:
# const [requirements, setRequirements] = useState<Requirement[]>([]);
# const [vendors, setVendors] = useState<Vendor[]>([]);
# ... fetchReceivedProducts block ...
# const [isAddReqOpen...]

# Let's extract the state vars that are BELOW the block, and put them ABOVE the block.
# Instead of doing that, let's just move the whole block to be inside a safe place.

import pathlib
path = r'C:\Users\ASUS\Downloads\universalSaas\universalSaas\src\pages\procurement\Requirements.tsx'
content = pathlib.Path(path).read_text(encoding='utf-8')

import re
# Find where fetchReceivedProducts starts
idx = content.find('const fetchReceivedProducts =')
# Find where the remaining useStates start
idx2 = content.find('const [isAddReqOpen', idx)
# Find where they end (isSubmitting)
idx3 = content.find('const [isSubmitting, setIsSubmitting] = useState(false);', idx2)
idx3 += len('const [isSubmitting, setIsSubmitting] = useState(false);')

if idx != -1 and idx2 != -1 and idx3 != -1:
    block_to_move = content[idx:idx2].strip()
    state_vars = content[idx2:idx3].strip()
    
    # We replace from idx to idx3 with state_vars + '\n\n' + block_to_move
    content = content[:idx] + state_vars + '\n\n  ' + block_to_move + '\n\n' + content[idx3:]
    pathlib.Path(path).write_text(content, encoding='utf-8')
    print("Fixed variable hoisting")
else:
    print("Could not find blocks")
