using MTAnalyzer.Models;

namespace MTAnalyzer.Services
{
    public interface IMTDecisionEngine
    {
        (bool MTRequired, string Reason, DesignType DesignType) DetermineMTRequirement(ModificationTravelerInput input);
    }

    public class MTDecisionEngine : IMTDecisionEngine
    {
        public (bool MTRequired, string Reason, DesignType DesignType) DetermineMTRequirement(ModificationTravelerInput input)
        {
            // Implementation of Figure 1 Decision Tree Logic

            // Step 1: Are all changes temporary?
            if (input.IsTemporary)
            {
                return (false, "All changes are temporary", DesignType.TypeIV);
            }

            // Step 2: Is the change physical?
            if (!input.IsPhysicalChange)
            {
                // Check if Facilities Change Package Process (TFC-ENG-DESIGN-C-67) is applicable
                if (input.FacilityChangePackageApplicable)
                {
                    return (false, "Use TFC-ENG-DESIGN-C-67 - Facilities Change Package Process", DesignType.TypeII);
                }
                
                // For procedure changes, check if technical procedures are involved
                if (input.RequiresNewProcedures)
                {
                    return (true, "Non-physical change requiring new or revised technical procedures", DesignType.TypeII);
                }
                
                return (false, "Non-physical change - MT may not be required", DesignType.TypeII);
            }

            // Step 3: Is the change an identical replacement? (Design Type V)
            if (input.IsIdenticalReplacement)
            {
                return (false, "Identical replacement - Design Type V", DesignType.TypeV);
            }

            // Step 4: Is the Design being performed outside the DA's group?
            if (input.IsDesignOutsideDA)
            {
                return (true, "Design being performed outside DA's group", DetermineDesignType(input));
            }

            // Step 5: Is a new or revised technical procedure, training, or maintenance manual required?
            if (input.RequiresNewProcedures)
            {
                return (true, "New or revised technical procedures/training/maintenance manual required", DetermineDesignType(input));
            }

            // Step 6: Is more than one Design Document (ECN, DCN, EDT, etc.) needed?
            if (input.RequiresMultipleDocuments)
            {
                return (true, "Multiple design documents required", DetermineDesignType(input));
            }

            // Step 7: Is the design single-discipline?
            if (!input.IsSingleDiscipline)
            {
                return (true, "Multi-discipline design required", DetermineDesignType(input));
            }

            // Step 8: Are revisions implemented outside the DA's group?
            if (input.RevisionsOutsideDA)
            {
                return (true, "Revisions implemented outside DA's group", DetermineDesignType(input));
            }

            // Step 9: Does the change also require a software change?
            if (input.RequiresSoftwareChange)
            {
                return (true, "Software changes required", DetermineDesignType(input));
            }

            // Step 10: Does the change require Hoisting and/or Rigging?
            if (input.RequiresHoistingRigging)
            {
                return (true, "Hoisting and/or rigging required", DetermineDesignType(input));
            }

            // If we reach here, MT may not be required based on the decision tree
            return (false, "Possibly exempt based on decision tree criteria", DetermineDesignType(input));
        }

        private DesignType DetermineDesignType(ModificationTravelerInput input)
        {
            // Determine design type based on project characteristics
            if (input.IsTemporary)
                return DesignType.TypeIV;

            if (input.IsIdenticalReplacement)
                return DesignType.TypeV;

            // Check for replacement scenarios first (before new installations)
            if (input.ProposedSolution.ToLower().Contains("replace") ||
                input.ProposedSolution.ToLower().Contains("replacement") ||
                input.ProblemDescription.ToLower().Contains("replace") ||
                input.ProblemDescription.ToLower().Contains("failed"))
            {
                // Non-identical replacement
                return DesignType.TypeIII;
            }

            // Check for new installations
            if (input.ProblemDescription.ToLower().Contains("new installation") ||
                input.ProblemDescription.ToLower().Contains("install new") ||
                input.ProblemDescription.ToLower().Contains("installing new") ||
                input.ProblemDescription.ToLower().Contains("new generator") ||
                input.ProblemDescription.ToLower().Contains("new system") ||
                input.ProblemDescription.ToLower().Contains("new equipment") ||
                input.ProposedSolution.ToLower().Contains("install new") ||
                input.ProposedSolution.ToLower().Contains("installing new") ||
                input.ProposedSolution.ToLower().Contains("new installation") ||
                input.ProposedSolution.ToLower().Contains("new generator") ||
                input.ProposedSolution.ToLower().Contains("new system"))
                return DesignType.TypeI;

            // Default to modification for other scenarios
            return DesignType.TypeII;
        }
    }
}
